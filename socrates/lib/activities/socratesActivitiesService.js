'use strict';

var _ = require('lodash');
var async = require('async');
var beans = require('simple-configure').get('beans');
var memberstore = beans.get('memberstore');
var eventstoreService = beans.get('eventstoreService');
var notifications = beans.get('socratesNotifications');
var roomOptions = beans.get('roomOptions');
var CONFLICTING_VERSIONS = beans.get('constants').CONFLICTING_VERSIONS;

var currentUrl = beans.get('socratesConstants').currentUrl;

function saveCommandProcessor(args) {
  eventstoreService.saveCommandProcessor(args.commandProcessor, function (err) {
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

  fromWaitinglistToParticipant: function (nickname, roomType, duration, callback) {
    var self = this;

    async.parallel(
      {
        registrationCommandProcessor: _.partial(eventstoreService.getRegistrationCommandProcessor, currentUrl),
        member: _.partial(memberstore.getMember, nickname)
      },
      function (err, results) {
        if (err || !results.registrationCommandProcessor || !results.member) { return callback(err); }

        results.registrationCommandProcessor.fromWaitinglistToParticipant(roomType, results.member.id(), duration);

        saveCommandProcessor({
          commandProcessor: results.registrationCommandProcessor,
          callback: callback,
          repeat: _.partial(self.fromWaitinglistToParticipant, nickname, roomType, duration),
          handleSuccess: function () {
            var bookingdetails = roomOptions.informationFor(roomType, duration);
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
        registrationCommandProcessor: _.partial(eventstoreService.getRegistrationCommandProcessor, currentUrl),
        member: _.partial(memberstore.getMember, nickname)
      },
      function (err, results) {
        if (err || !results.registrationCommandProcessor || !results.member) { return callback(err); }

        results.registrationCommandProcessor.setNewDurationForParticipant(results.member.id(), duration);

        saveCommandProcessor({
          commandProcessor: results.registrationCommandProcessor,
          callback: callback,
          repeat: _.partial(self.newDurationFor, nickname, resourceName, duration),
          handleSuccess: function () {
            notifications.changedDuration(results.member, roomOptions.informationFor(resourceName, duration));
          }
        });
      }
    );
  },

  newRoomTypeFor: function (nickname, newRoomType, callback) {
    var self = this;

    async.parallel(
      {
        registrationCommandProcessor: _.partial(eventstoreService.getRegistrationCommandProcessor, currentUrl),
        member: _.partial(memberstore.getMember, nickname)
      },
      function (err, results) {
        if (err || !results.registrationCommandProcessor || !results.member) { return callback(err); }

        results.registrationCommandProcessor.moveParticipantToNewRoomType(results.member.id(), newRoomType);

        saveCommandProcessor({
          commandProcessor: results.registrationCommandProcessor,
          callback: callback,
          repeat: _.partial(self.newRoomTypeFor, nickname, newRoomType),
          handleSuccess: function () {
            notifications.changedResource(results.member, roomOptions.informationFor(newRoomType, undefined)); // TODO: must be duration!
          }
        });
      }
    );
  },

  newWaitinglistFor: function (nickname, newResourceName, callback) {
    var self = this;

    async.parallel(
      {
        registrationCommandProcessor: _.partial(eventstoreService.getRegistrationCommandProcessor, currentUrl),
        member: _.partial(memberstore.getMember, nickname)
      },
      function (err, results) {
        if (err || !results.activity || !results.member) { return callback(err); }

        results.registrationCommandProcessor.changeDesiredRoomTypes(results.member.id(), [newResourceName]);

        saveCommandProcessor({
          commandProcessor: results.registrationCommandProcessor,
          callback: callback,
          repeat: _.partial(self.newWaitinglistFor, nickname, newResourceName),
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
          commandProcessor: results.roomsCommandProcessor,
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
          commandProcessor: results.roomsCommandProcessor,
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
          commandProcessor: results.roomsCommandProcessor,
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

        saveCommandProcessor({
          commandProcessor: results.registrationCommandProcessor,
          callback: callback,
          repeat: _.partial(self.removeWaitinglistMemberFor, roomType, waitinglistMemberNick),
          handleSuccess: function () {
            notifications.removedFromWaitinglist(results.waitinglistMember);
          }
        });
      }
    );
  }
};
