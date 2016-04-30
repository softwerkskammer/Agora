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

function saveCommandProcessor2(args) {
  eventstoreService.saveCommandProcessor2(args.commandProcessor, args.events, function (err) {
    if (err) { return args.callback(err); }
    if (args.handleSuccess) { args.handleSuccess(); }
    return args.callback();
  });
}

module.exports = {

  fromWaitinglistToParticipant: function (nickname, roomType, duration, now, callback) {
    async.series(
      [
        _.partial(memberstore.getMember, nickname),
        _.partial(eventstoreService.getRegistrationCommandProcessor, currentUrl).bind(eventstoreService)
      ],
      function (err, results) {
        if (err) { return callback(err); }
        const member = results[0];
        const registrationCommandProcessor = results[1];
        if (!registrationCommandProcessor || !member) { return callback(); }

        const event = registrationCommandProcessor.fromWaitinglistToParticipant(roomType, member.id(), duration, now);

        saveCommandProcessor2({
          commandProcessor: registrationCommandProcessor,
          events: [event],
          callback: callback,
          handleSuccess: function () {
            var bookingdetails = roomOptions.informationFor(roomType, duration);
            bookingdetails.fromWaitinglist = true;
            notifications.newParticipant(member.id(), bookingdetails);
          }
        });
      }
    );
  },

  newDurationFor: function (nickname, roomType, duration, callback) {

    async.series(
      [
        _.partial(memberstore.getMember, nickname),
        _.partial(eventstoreService.getRegistrationCommandProcessor, currentUrl).bind(eventstoreService)
      ],
      function (err, results) {
        if (err) { return callback(err); }
        const member = results[0];
        const registrationCommandProcessor = results[1];
        if (!registrationCommandProcessor || !member) { return callback(); }

        const event = registrationCommandProcessor.setNewDurationForParticipant(member.id(), duration);

        saveCommandProcessor2({
          commandProcessor: registrationCommandProcessor,
          events: [event],
          callback: callback,
          handleSuccess: function () {
            notifications.changedDuration(member, roomOptions.informationFor(roomType, duration));
          }
        });
      }
    );
  },

  newRoomTypeFor: function (nickname, newRoomType, callback) {

    async.series(
      [
        _.partial(memberstore.getMember, nickname),
        _.partial(eventstoreService.getRegistrationCommandProcessor, currentUrl).bind(eventstoreService)
      ],
      function (err, results) {
        if (err) { return callback(err); }
        const member = results[0];
        const registrationCommandProcessor = results[1];
        if (!registrationCommandProcessor || !member) { return callback(); }

        const event = registrationCommandProcessor.moveParticipantToNewRoomType(member.id(), newRoomType);

        saveCommandProcessor2({
          commandProcessor: registrationCommandProcessor,
          events: [event],
          callback: callback,
          handleSuccess: function () {
            notifications.changedResource(member, roomOptions.informationFor(newRoomType, event.duration)); // this is a bit hacky, we should better go through a read model
          }
        });
      }
    );
  },

  newWaitinglistFor: function (nickname, newDesiredResourceNames, callback) {

    async.series(
      [
        _.partial(memberstore.getMember, nickname),
        _.partial(eventstoreService.getRegistrationCommandProcessor, currentUrl).bind(eventstoreService)
      ],
      function (err, results) {
        if (err) { return callback(err); }
        const member = results[0];
        const registrationCommandProcessor = results[1];
        if (!registrationCommandProcessor || !member) { return callback(); }

        const event = registrationCommandProcessor.changeDesiredRoomTypes(member.id(), newDesiredResourceNames);

        saveCommandProcessor2({
          commandProcessor: registrationCommandProcessor,
          events: [event],
          callback: callback,
          handleSuccess: function () {
            notifications.changedWaitinglist(member, newDesiredResourceNames.map(name => roomOptions.informationFor(name, 'waitinglist')));
          }
        });
      }
    );
  },

  addParticipantPairFor: function (roomType, participant1Nick, participant2Nick, callback) {

    async.series(
      [
        _.partial(memberstore.getMember, participant1Nick),
        _.partial(memberstore.getMember, participant2Nick),
        _.partial(eventstoreService.getRoomsCommandProcessor, currentUrl).bind(eventstoreService)
      ],
      function (err, results) {
        if (err) { return callback(err); }
        const participant1 = results[0];
        const participant2 = results[1];
        const roomsCommandProcessor = results[2];
        if (!roomsCommandProcessor || !participant1 || !participant2) { return callback(); }

        const events = roomsCommandProcessor.addParticipantPairFor(roomType, participant1.id(), participant2.id());

        saveCommandProcessor2({
          commandProcessor: roomsCommandProcessor,
          events: events,
          callback: callback
        });
      }
    );
  },

  removeParticipantPairFor: function (roomType, participant1Nick, participant2Nick, callback) {

    async.series(
      [
        _.partial(memberstore.getMember, participant1Nick),
        _.partial(memberstore.getMember, participant2Nick),
        _.partial(eventstoreService.getRoomsCommandProcessor, currentUrl).bind(eventstoreService)
      ],
      function (err, results) {
        if (err) { return callback(err); }
        const participant1 = results[0];
        const participant2 = results[1];
        const roomsCommandProcessor = results[2];
        if (!roomsCommandProcessor || !participant1 || !participant2) { return callback(); }

        const events = roomsCommandProcessor.removeParticipantPairFor(roomType, participant1.id(), participant2.id());

        saveCommandProcessor2({
          commandProcessor: roomsCommandProcessor,
          events: events,
          callback: callback
        });
      }
    );
  },

  removeParticipantFor: function (roomType, participantNick, callback) {

    async.series(
      [
        _.partial(memberstore.getMember, participantNick),
        _.partial(eventstoreService.getRoomsCommandProcessor, currentUrl).bind(eventstoreService),
        _.partial(eventstoreService.getRegistrationCommandProcessor, currentUrl).bind(eventstoreService)
      ],
      function (err, results) {
        if (err) { return callback(err); }
        const participant = results[0];
        const roomsCommandProcessor = results[1];
        const registrationCommandProcessor = results[2];
        if (!roomsCommandProcessor || !registrationCommandProcessor || !participant) { return callback(); }

        const roomsEvents = roomsCommandProcessor.removeParticipantPairContaining(roomType, participant.id());
        const registrationEvent = registrationCommandProcessor.removeParticipant(roomType, participant.id());

        saveCommandProcessor2({
          commandProcessor: [roomsCommandProcessor, registrationCommandProcessor],
          events: [roomsEvents, [registrationEvent]],
          callback: callback,
          handleSuccess: function () {
            notifications.removedFromParticipants(participant);
          }
        });
      }
    );
  },

  removeWaitinglistMemberFor: function (desiredRoomTypes, waitinglistMemberNick, callback) {
    var self = this;

    async.series(
      [
        _.partial(memberstore.getMember, waitinglistMemberNick),
        _.partial(eventstoreService.getRegistrationCommandProcessor, currentUrl).bind(eventstoreService)
      ],
      function (err, results) {
        if (err) { return callback(err); }
        const waitinglistMember = results[0];
        const registrationCommandProcessor = results[1];
        if (!registrationCommandProcessor || !waitinglistMember) { return callback(); }

        registrationCommandProcessor.removeWaitinglistParticipant(desiredRoomTypes, waitinglistMember.id());

        saveCommandProcessor({
          commandProcessor: registrationCommandProcessor,
          callback: callback,
          repeat: _.partial(self.removeWaitinglistMemberFor, desiredRoomTypes, waitinglistMemberNick),
          handleSuccess: function () {
            notifications.removedFromWaitinglist(waitinglistMember);
          }
        });
      }
    );
  }
};
