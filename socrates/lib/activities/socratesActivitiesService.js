'use strict';

var _ = require('lodash');
var async = require('async');
var beans = require('simple-configure').get('beans');
var e = beans.get('eventConstants');
var memberstore = beans.get('memberstore');
var eventstoreService = beans.get('eventstoreService');
var notifications = beans.get('socratesNotifications');
var roomOptions = beans.get('roomOptions');

var currentUrl = beans.get('socratesConstants').currentUrl;

const ValidationErrors = beans.get('validationErrors');

function saveCommandProcessor(args) {
  eventstoreService.saveCommandProcessor(args.commandProcessor, args.events, function (err) {
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

        const args = {commandProcessor: registrationCommandProcessor, events: [event], callback: callback};

        if (event.event === e.PARTICIPANT_WAS_REGISTERED || event.event === e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST) {
          args.handleSuccess = function () {
            var bookingdetails = roomOptions.informationFor(roomType, duration);
            bookingdetails.fromWaitinglist = true;
            notifications.newParticipant(member.id(), bookingdetails);
          };
        }
        saveCommandProcessor(args);
      }
    );
  },

  newDurationFor: function (params, callback) {

    if (!params.nickname || !roomOptions.isValidRoomType(params.roomType) || !roomOptions.isValidDuration(params.duration)) {
      return callback();
    }

    async.series(
      [
        _.partial(memberstore.getMember, params.nickname),
        _.partial(eventstoreService.getRegistrationCommandProcessor, currentUrl).bind(eventstoreService)
      ],
      function (err, results) {
        if (err) { return callback(err); }
        const member = results[0];
        const registrationCommandProcessor = results[1];
        if (!registrationCommandProcessor || !member) { return callback(); }

        const event = registrationCommandProcessor.setNewDurationForParticipant(member.id(), params.duration);

        const args = {commandProcessor: registrationCommandProcessor, events: [event], callback: callback};

        if (event.event === e.DURATION_WAS_CHANGED) {
          args.handleSuccess = function () {
            notifications.changedDuration(member, roomOptions.informationFor(params.roomType, params.duration));
          };
        }
        saveCommandProcessor(args);
      }
    );
  },

  newRoomTypeFor: function (params, callback) {

    const validationErrors = [];
    if (!params.nickname) { validationErrors.push('An empty nickname is invalid!'); }
    if (!roomOptions.isValidRoomType(params.newRoomType)) { validationErrors.push('The room type is invalid!'); }
    if (validationErrors.length > 0) { return callback(new ValidationErrors(validationErrors)); }

    async.series(
      [
        _.partial(memberstore.getMember, params.nickname),
        _.partial(eventstoreService.getRegistrationCommandProcessor, currentUrl).bind(eventstoreService)
      ],
      function (err, results) {
        if (err) { return callback(err); }
        const member = results[0];
        const registrationCommandProcessor = results[1];
        if (!registrationCommandProcessor || !member) { return callback(); }

        const event = registrationCommandProcessor.moveParticipantToNewRoomType(member.id(), params.newRoomType);

        const args = {commandProcessor: registrationCommandProcessor, events: [event], callback: callback};

        if (event.event === e.ROOM_TYPE_WAS_CHANGED) {
          args.handleSuccess = function () {
            notifications.changedResource(member, roomOptions.informationFor(params.newRoomType, event.duration)); // this is a bit hacky, we should better go through a read model
          };
        }
        saveCommandProcessor(args);
      }
    );
  },

  newWaitinglistFor: function (params, callback) {

    async.series(
      [
        _.partial(memberstore.getMember, params.nickname),
        _.partial(eventstoreService.getRegistrationCommandProcessor, currentUrl).bind(eventstoreService)
      ],
      function (err, results) {
        if (err) { return callback(err); }
        const member = results[0];
        const registrationCommandProcessor = results[1];
        if (!registrationCommandProcessor || !member) { return callback(); }

        const event = registrationCommandProcessor.changeDesiredRoomTypes(member.id(), params.newDesiredRoomTypes);

        const args = {commandProcessor: registrationCommandProcessor, events: [event], callback: callback};

        if (event.event === e.DESIRED_ROOM_TYPES_WERE_CHANGED) {
          args.handleSuccess = function () {
            notifications.changedWaitinglist(member, params.newDesiredRoomTypes.map(name => roomOptions.informationFor(name, 'waitinglist')));
          };
        }
        saveCommandProcessor(args);
      }
    );
  },

  addParticipantPairFor: function (params, callback) {

    async.series(
      [
        _.partial(memberstore.getMember, params.participant1Nick),
        _.partial(memberstore.getMember, params.participant2Nick),
        _.partial(eventstoreService.getRoomsCommandProcessor, currentUrl).bind(eventstoreService)
      ],
      function (err, results) {
        if (err) { return callback(err); }
        const participant1 = results[0];
        const participant2 = results[1];
        const roomsCommandProcessor = results[2];
        if (!roomsCommandProcessor || !participant1 || !participant2) { return callback(); }

        const events = roomsCommandProcessor.addParticipantPairFor(params.roomType, participant1.id(), participant2.id());

        saveCommandProcessor({
          commandProcessor: roomsCommandProcessor,
          events: events,
          callback: callback
        });
      }
    );
  },

  removeParticipantPairFor: function (params, callback) {

    async.series(
      [
        _.partial(memberstore.getMember, params.participant1Nick),
        _.partial(memberstore.getMember, params.participant2Nick),
        _.partial(eventstoreService.getRoomsCommandProcessor, currentUrl).bind(eventstoreService)
      ],
      function (err, results) {
        if (err) { return callback(err); }
        const participant1 = results[0];
        const participant2 = results[1];
        const roomsCommandProcessor = results[2];
        if (!roomsCommandProcessor || !participant1 || !participant2) { return callback(); }

        const events = roomsCommandProcessor.removeParticipantPairFor(params.roomType, participant1.id(), participant2.id());

        saveCommandProcessor({
          commandProcessor: roomsCommandProcessor,
          events: events,
          callback: callback
        });
      }
    );
  },

  removeParticipantFor: function (params, callback) {

    async.series(
      [
        _.partial(memberstore.getMember, params.participantNick),
        _.partial(eventstoreService.getRoomsCommandProcessor, currentUrl).bind(eventstoreService),
        _.partial(eventstoreService.getRegistrationCommandProcessor, currentUrl).bind(eventstoreService)
      ],
      function (err, results) {
        if (err) { return callback(err); }
        const participant = results[0];
        const roomsCommandProcessor = results[1];
        const registrationCommandProcessor = results[2];
        if (!roomsCommandProcessor || !registrationCommandProcessor || !participant) { return callback(); }

        const roomsEvents = roomsCommandProcessor.removeParticipantPairContaining(params.roomType, participant.id());
        const registrationEvent = registrationCommandProcessor.removeParticipant(params.roomType, participant.id());

        const args = {commandProcessor: [roomsCommandProcessor, registrationCommandProcessor], events: [roomsEvents, [registrationEvent]], callback: callback};
        if (registrationEvent.event === e.PARTICIPANT_WAS_REMOVED) {
          args.handleSuccess = function () {
            notifications.removedFromParticipants(participant);
          };
        }
        saveCommandProcessor(args);
      }
    );
  },

  removeWaitinglistMemberFor: function (params, callback) {

    async.series(
      [
        _.partial(memberstore.getMember, params.waitinglistMemberNick),
        _.partial(eventstoreService.getRegistrationCommandProcessor, currentUrl).bind(eventstoreService)
      ],
      function (err, results) {
        if (err) { return callback(err); }
        const waitinglistMember = results[0];
        const registrationCommandProcessor = results[1];
        if (!registrationCommandProcessor || !waitinglistMember) { return callback(); }

        const event = registrationCommandProcessor.removeWaitinglistParticipant(params.desiredRoomTypes, waitinglistMember.id());

        const args = {commandProcessor: registrationCommandProcessor, events: [event], callback: callback};

        if (event.event === e.WAITINGLIST_PARTICIPANT_WAS_REMOVED) {
          args.handleSuccess = function () {
            notifications.removedFromWaitinglist(waitinglistMember);
          };
        }
        saveCommandProcessor(args);
      }
    );
  }
};
