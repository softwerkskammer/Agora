'use strict';

var _ = require('lodash');
var async = require('async');
var beans = require('simple-configure').get('beans');
var subscriberstore = beans.get('subscriberstore');
var memberstore = beans.get('memberstore');
var activitystore = beans.get('activitystore');
var notifications = beans.get('socratesNotifications');
var roomOptions = beans.get('roomOptions');
var CONFLICTING_VERSIONS = beans.get('constants').CONFLICTING_VERSIONS;

var currentUrl = beans.get('socratesConstants').currentUrl;

function saveActivity(args) {
  activitystore.saveActivity(args.activity, function (err) {
    if (err && err.message === CONFLICTING_VERSIONS) {
      // we try again because of a racing condition during save:
      return args.repeat(args.callback);
    }
    if (err) { return args.callback(err); }
    args.handleSuccess();
    return args.callback();
  });
}

module.exports = {

  submitPaymentReceived: function (nickname, callback) {
    subscriberstore.getSubscriberByNickname(nickname, function (err, subscriber) {
      if (err || !subscriber) { return callback(err); }
      if (!subscriber.isParticipating()) {return callback(new Error(nickname + ' is not participating!')); }
      subscriber.currentParticipation().payment().notePaymentReceived();
      subscriberstore.saveSubscriber(subscriber, function (err1) {
        if (err1) { return callback(err1); }
        notifications.paymentMarked(nickname);
        callback(null);
      });
    });
  },

  fromWaitinglistToParticipant: function (nickname, registrationTuple, callback) {
    var self = this;

    async.parallel({
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
      });
  },

  newDurationFor: function (nickname, resourceName, duration, callback) {
    var self = this;

    async.parallel({
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
      });
  },

  newResourceFor: function (nickname, resourceName, newResourceName, callback) {
    var self = this;

    async.parallel({
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
      });
  },

  newWaitinglistFor: function (nickname, resourceName, newResourceName, callback) {
    var self = this;

    async.parallel({
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
      });
  },

  newParticipantPairFor: function (resourceName, participant1Nick, participant2Nick, callback) {
    var self = this;
    activitystore.getActivity(currentUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      memberstore.getMember(participant1Nick, function (err1, participant1) {
        if (err1 || !participant1) { return callback(err1); }
        memberstore.getMember(participant2Nick, function (err2, participant2) {
          if (err2 || !participant2) { return callback(err2); }
          activity.rooms(resourceName).add(participant1.id(), participant2.id());
          return activitystore.saveActivity(activity, function (err3) {
            if (err3 && err3.message === CONFLICTING_VERSIONS) {
              // we try again because of a racing condition during save:
              return self.newParticipantPairFor(resourceName, participant1Nick, participant2Nick, callback);
            }
            return callback(err3);
          });

        });
      });
    });
  },

  removeParticipantPairFor: function (resourceName, participant1Nick, participant2Nick, callback) {
    var self = this;
    activitystore.getActivity(currentUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      memberstore.getMember(participant1Nick, function (err1, participant1) {
        if (err1 || !participant1) { return callback(err1); }
        memberstore.getMember(participant2Nick, function (err2, participant2) {
          if (err2 || !participant2) { return callback(err2); }
          activity.rooms(resourceName).remove(participant1.id(), participant2.id());
          return activitystore.saveActivity(activity, function (err3) {
            if (err3 && err3.message === CONFLICTING_VERSIONS) {
              // we try again because of a racing condition during save:
              return self.removeParticipantPairFor(resourceName, participant1Nick, participant2Nick, callback);
            }
            return callback(err3);
          });

        });
      });
    });
  },

  removeParticipantFor: function (resourceName, participantNick, callback) {
    var self = this;
    activitystore.getActivity(currentUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      memberstore.getMember(participantNick, function (err1, participant) {
        if (err1 || !participant) { return callback(err1); }
        activity.socratesResourceNamed(resourceName).removeMemberId(participant.id());
        var rooms = activity.rooms(resourceName);
        _.each(rooms.roomPairsWithMembersFrom([participant.id()]), function (roomPair) {
          rooms.remove(roomPair.participant1, roomPair.participant2);
        });
        return activitystore.saveActivity(activity, function (err2) {
          if (err2 && err2.message === CONFLICTING_VERSIONS) {
            // we try again because of a racing condition during save:
            return self.removeParticipantFor(resourceName, participantNick, callback);
          }
          return callback(err2);
        });
      });
    });
  }

};
