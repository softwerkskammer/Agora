'use strict';

var _ = require('lodash');
var async = require('async');
var beans = require('simple-configure').get('beans');
var subscriberstore = beans.get('subscriberstore');
var memberstore = beans.get('memberstore');
var activitystore = beans.get('activitystore');
var eventstoreService = beans.get('eventstoreService');
var notifications = beans.get('socratesNotifications');
var roomOptions = beans.get('roomOptions');
var CONFLICTING_VERSIONS = beans.get('constants').CONFLICTING_VERSIONS;
var Participation = beans.get('socratesParticipation');

var currentUrl = beans.get('socratesConstants').currentUrl;

function saveActivity(args) {
  activitystore.saveActivity(args.activity, function (err) {
    if (err && err.message === CONFLICTING_VERSIONS) {
      // we try again because of a racing condition during save:
      return args.repeat(args.callback);
    }
    if (err) { return args.callback(err); }
    if (args.handleSuccess) { args.handleSuccess(); }
    return args.callback();
  });
}

function saveCommandProcessor(args) {
  eventstoreService.saveCommandProcessor(args.roomsCommandProcessor, function (err) {
    if (err && err.message === CONFLICTING_VERSIONS) {
      // we try again because of a racing condition during save:
      return args.repeat(args.callback);
    }
    if (err) { return args.callback(err); }
    if (args.handleSuccess) { args.handleSuccess(); }
    return args.callback();
  });
}

module.exports = {

  fromWaitinglistToParticipant: function (nickname, registrationTuple, callback) {
    var self = this;

    async.parallel(
      {
        activity: _.partial(activitystore.getActivity, registrationTuple.activityUrl),
        member: _.partial(memberstore.getMember, nickname)
      },
      function (err, results) {
        if (err || !results.activity || !results.member) { return callback(err); }

        results.activity.register(results.member.id(), registrationTuple);

        saveActivity({
          activity: results.activity,
          callback: callback,
          repeat: _.partial(self.fromWaitinglistToParticipant, nickname, registrationTuple),
          handleSuccess: function () {
            var bookingdetails = roomOptions.informationFor(registrationTuple.resourceName, registrationTuple.duration);
            bookingdetails.fromWaitinglist = true;
            notifications.newParticipant(results.member.id(), bookingdetails);
          }
        });
      }
    );
  },

  newDurationFor: function (nickname, resourceName, duration, callback) {
    var self = this;

    async.parallel(
      {
        activity: _.partial(activitystore.getActivity, currentUrl),
        member: _.partial(memberstore.getMember, nickname)
      },
      function (err, results) {
        if (err || !results.activity || !results.member) { return callback(err); }

        results.activity.socratesResourceNamed(resourceName).recordFor(results.member.id()).duration = duration;

        saveActivity({
          activity: results.activity,
          callback: callback,
          repeat: _.partial(self.newDurationFor, nickname, resourceName, duration),
          handleSuccess: function () {
            notifications.changedDuration(results.member, roomOptions.informationFor(resourceName, duration));
          }
        });
      }
    );
  },

  newResourceFor: function (nickname, resourceName, newResourceName, callback) {
    var self = this;

    async.parallel(
      {
        activity: _.partial(activitystore.getActivity, currentUrl),
        member: _.partial(memberstore.getMember, nickname)
      },
      function (err, results) {
        if (err || !results.activity || !results.member) { return callback(err); }

        var oldResource = results.activity.socratesResourceNamed(resourceName);
        var registrationRecord = oldResource.recordFor(results.member.id());
        oldResource.removeMemberId(results.member.id());
        results.activity.socratesResourceNamed(newResourceName).addRecord(registrationRecord);

        saveActivity({
          activity: results.activity,
          callback: callback,
          repeat: _.partial(self.newResourceFor, nickname, resourceName, newResourceName),
          handleSuccess: function () {
            notifications.changedResource(results.member, roomOptions.informationFor(newResourceName, registrationRecord.duration));
          }
        });
      }
    );
  },

  newWaitinglistFor: function (nickname, resourceName, newResourceName, callback) {
    var self = this;

    async.parallel(
      {
        activity: _.partial(activitystore.getActivity, currentUrl),
        member: _.partial(memberstore.getMember, nickname)
      },
      function (err, results) {
        if (err || !results.activity || !results.member) { return callback(err); }

        var oldResource = results.activity.socratesResourceNamed(resourceName);
        var waitinglistRecord = oldResource.waitinglistRecordFor(results.member.id());
        oldResource.removeFromWaitinglist(results.member.id());
        results.activity.socratesResourceNamed(newResourceName).addWaitinglistRecord(waitinglistRecord);

        saveActivity({
          activity: results.activity,
          callback: callback,
          repeat: _.partial(self.newWaitinglistFor, nickname, resourceName, newResourceName),
          handleSuccess: function () {
            notifications.changedWaitinglist(results.member, roomOptions.informationFor(newResourceName, 'waitinglist'));
          }
        });
      }
    );
  },

  addParticipantPairFor: function (roomType, participant1Nick, participant2Nick, callback) {
    var self = this;

    async.parallel(
      {
        roomsCommandProcessor: _.partial(eventstoreService.getRoomsCommandProcessor, currentUrl),
        participant1: _.partial(memberstore.getMember, participant1Nick),
        participant2: _.partial(memberstore.getMember, participant2Nick)
      },
      function (err, results) {
        if (err || !results.roomsCommandProcessor || !results.participant1 || !results.participant2) { return callback(err); }

        results.roomsCommandProcessor.addParticipantPairFor(roomType, results.participant1.id(), results.participant2.id());

        saveCommandProcessor({
          roomsCommandProcessor: results.roomsCommandProcessor,
          callback: callback,
          repeat: _.partial(self.addParticipantPairFor, roomType, participant1Nick, participant2Nick)
        });
      }
    );
  },

  removeParticipantPairFor: function (roomType, participant1Nick, participant2Nick, callback) {
    var self = this;

    async.parallel(
      {
        roomsCommandProcessor: _.partial(eventstoreService.getRoomsCommandProcessor, currentUrl),
        participant1: _.partial(memberstore.getMember, participant1Nick),
        participant2: _.partial(memberstore.getMember, participant2Nick)
      },
      function (err, results) {
        if (err || !results.roomsCommandProcessor || !results.participant1 || !results.participant2) { return callback(err); }

        results.roomsCommandProcessor.removeParticipantPairFor(roomType, results.participant1.id(), results.participant2.id());

        saveCommandProcessor({
          roomsCommandProcessor: results.roomsCommandProcessor,
          callback: callback,
          repeat: _.partial(self.removeParticipantPairFor, roomType, participant1Nick, participant2Nick)
        });
      }
    );
  },

  removeParticipantFor: function (roomType, participantNick, callback) {
    var self = this;

    async.parallel(
      {
        roomsCommandProcessor: _.partial(eventstoreService.getRoomsCommandProcessor, currentUrl),
        registrationCommandProcessor: _.partial(eventstoreService.getRegistrationCommandProcessor, currentUrl),
        participant: _.partial(memberstore.getMember, participantNick)
      },
      function (err, results) {
        if (err || !results.roomsCommandProcessor || !results.registrationCommandProcessor || !results.participant) { return callback(err); }

        results.roomsCommandProcessor.removeParticipantPairContaining(roomType, results.participant.id());
        results.registrationCommandProcessor.removeParticipant(roomType, results.participant.id());

        saveCommandProcessor({
          roomsCommandProcessor: results.roomsCommandProcessor,
          callback: callback,
          repeat: _.partial(self.removeParticipantFor, roomType, participantNick),
          handleSuccess: function () {
            notifications.removedFromParticipants(results.participant);
          }
        });
      }
    );
  },

  removeWaitinglistMemberFor: function (roomType, waitinglistMemberNick, callback) {
    var self = this;

    async.parallel(
      {
        registrationCommandProcessor: _.partial(eventstoreService.getRegistrationCommandProcessor, currentUrl),
        waitinglistMember: _.partial(memberstore.getMember, waitinglistMemberNick)
      },
      function (err, results) {
        if (err || !results.registrationCommandProcessor || !results.waitinglistMember) { return callback(err); }

        results.registrationCommandProcessor.removeWaitinglistParticipant(roomType, results.waitinglistMember.id());

        saveActivity({
          activity: results.registrationCommandProcessor,
          callback: callback,
          repeat: _.partial(self.removeWaitinglistMemberFor, roomType, waitinglistMemberNick),
          handleSuccess: function () {
            notifications.removedFromWaitinglist(results.waitinglistMember);
          }
        });
      }
    );
  },

  getActivityWithParticipantsAndSubscribers: function (year, callback) {
    activitystore.getActivity('socrates-' + year, function (err, activity) {
      if (err || !activity) { return callback(err); }

      async.parallel({
        members: _.partial(memberstore.getMembersForIds, activity.allRegisteredMembers()),
        subscribers: subscriberstore.allSubscribers
      }, function (err1, results) {
        if (err1) { return callback(err1); }
        _.each(results.members, function (member) {
          var subscriber = _.find(results.subscribers, function (sub) { return sub.id() === member.id(); });
          member.participation = subscriber ? subscriber.participationOf(year) : new Participation();
        });
        activity.participants = results.members;
        callback(null, activity);
      });

    });
  },

  participationStatus: function (subscriber, callback) {
    function containsSoCraTes(activities) {
      return !!_.find(activities, 'state.isSoCraTes');
    }

    activitystore.activitiesForGroupIdsAndRegisteredMemberId([], subscriber.id(), true, function (err, upcomingActivities) {
      if (err) { return callback(err); }
      activitystore.activitiesForGroupIdsAndRegisteredMemberId([], subscriber.id(), false, function (err1, pastActivities) {
        if (err1) { return callback(err1); }
        callback(null, containsSoCraTes(upcomingActivities.concat(pastActivities)));
      });
    });

  }
};
