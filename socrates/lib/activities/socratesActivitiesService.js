'use strict';

const R = require('ramda');
const async = require('async');
const beans = require('simple-configure').get('beans');
const e = beans.get('eventConstants');
const memberstore = beans.get('memberstore');
const eventstoreService = beans.get('eventstoreService');
const notifications = beans.get('socratesNotifications');
const roomOptions = beans.get('roomOptions');

const currentUrl = beans.get('socratesConstants').currentUrl;

const ValidationErrors = beans.get('validationErrors');

function saveCommandProcessor(args) {
  eventstoreService.saveCommandProcessor(args.commandProcessor, args.events, err => {
    if (err) { return args.callback(err); }
    if (args.handleSuccess) { args.handleSuccess(); }
    return args.callback();
  });
}

function validate(params) {
  const validationErrors = R.keys(params).map(key => {
    switch (key) {
    case 'nickname':
      if (!params.nickname) { return 'An empty nickname is invalid!'; } else { return null; }
    case 'nickname1':
      if (!params.nickname1) { return 'An empty first nickname is invalid!'; } else { return null; }
    case 'nickname2':
      if (!params.nickname2) { return 'An empty second nickname is invalid!'; } else { return null; }
    case 'roomType':
      if (!roomOptions.isValidRoomType(params.roomType)) { return 'The room type is invalid!'; } else { return null; }
    case 'roomTypes':
      if (!params.roomTypes || params.roomTypes.length === 0) {
        return 'Please select at least one desired room type!';
      } else {
        return R.all(roomOptions.isValidRoomType, params.roomTypes) ? null : 'One of the room types is invalid!';
      }
    case 'duration':
      if (!roomOptions.isValidDuration(params.duration)) { return 'The duration is invalid!'; } else { return null; }
    default:
      return null;
    }
  }).filter(m => m);

  if (validationErrors.length > 0) { return new ValidationErrors(validationErrors); }
  return null;
}

module.exports = {

  fromWaitinglistToParticipant: function fromWaitinglistToParticipant(params, now, callback) {

    const validationErrors = validate(params);
    if (validationErrors) { return callback(validationErrors); }

    async.series(
      [
        R.partial(memberstore.getMember, [params.nickname]),
        R.partial(eventstoreService.getRegistrationCommandProcessor, [currentUrl]).bind(eventstoreService)
      ],
      (err, results) => {
        if (err) { return callback(err); }
        const member = results[0];
        const registrationCommandProcessor = results[1];
        if (!registrationCommandProcessor || !member) { return callback(); }

        const event = registrationCommandProcessor.fromWaitinglistToParticipant(params.roomType, member.id(), now);

        const args = {commandProcessor: registrationCommandProcessor, events: [event], callback};

        if (event.event === e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST) {
          args.handleSuccess = () => {
            const bookingdetails = roomOptions.informationFor(event.roomType, event.duration);
            bookingdetails.fromWaitinglist = true;
            notifications.newParticipant(member.id(), bookingdetails);
          };
        }
        saveCommandProcessor(args);
      }
    );
  },

  newDurationFor: function newDurationFor(params, callback) {

    const validationErrors = validate(params);
    if (validationErrors) { return callback(validationErrors); }

    async.series(
      [
        R.partial(memberstore.getMember, [params.nickname]),
        R.partial(eventstoreService.getRegistrationCommandProcessor, [currentUrl]).bind(eventstoreService)
      ],
      (err, results) => {
        if (err) { return callback(err); }
        const member = results[0];
        const registrationCommandProcessor = results[1];
        if (!registrationCommandProcessor || !member) { return callback(); }

        const event = registrationCommandProcessor.setNewDurationForParticipant(member.id(), params.duration);

        const args = {commandProcessor: registrationCommandProcessor, events: [event], callback};

        if (event.event === e.DURATION_WAS_CHANGED) {
          args.handleSuccess = () => notifications.changedDuration(member, roomOptions.informationFor(params.roomType, params.duration));
        }
        saveCommandProcessor(args);
      }
    );
  },

  newRoomTypeFor: function newRoomTypeFor(params, callback) {

    const validationErrors = validate({nickname: params.nickname, roomType: params.newRoomType});
    if (validationErrors) { return callback(validationErrors); }

    async.series(
      [
        R.partial(memberstore.getMember, [params.nickname]),
        R.partial(eventstoreService.getRegistrationCommandProcessor, [currentUrl]).bind(eventstoreService)
      ],
      (err, results) => {
        if (err) { return callback(err); }
        const member = results[0];
        const registrationCommandProcessor = results[1];
        if (!registrationCommandProcessor || !member) { return callback(); }

        const event = registrationCommandProcessor.moveParticipantToNewRoomType(member.id(), params.newRoomType);

        const args = {commandProcessor: registrationCommandProcessor, events: [event], callback};

        if (event.event === e.ROOM_TYPE_WAS_CHANGED) {
          args.handleSuccess = () => notifications.changedResource(member, roomOptions.informationFor(params.newRoomType, event.duration)); // this is a bit hacky, we should better go through a read model
        }
        saveCommandProcessor(args);
      }
    );
  },

  newWaitinglistFor: function newWaitinglistFor(params, callback) {

    const validationErrors = validate({nickname: params.nickname, roomTypes: params.newDesiredRoomTypes});
    if (validationErrors) { return callback(validationErrors); }

    async.series(
      [
        R.partial(memberstore.getMember, [params.nickname]),
        R.partial(eventstoreService.getRegistrationCommandProcessor, [currentUrl]).bind(eventstoreService)
      ],
      (err, results) => {
        if (err) { return callback(err); }
        const member = results[0];
        const registrationCommandProcessor = results[1];
        if (!registrationCommandProcessor || !member) { return callback(); }

        const event = registrationCommandProcessor.changeDesiredRoomTypes(member.id(), params.newDesiredRoomTypes);

        const args = {commandProcessor: registrationCommandProcessor, events: [event], callback};

        if (event.event === e.DESIRED_ROOM_TYPES_WERE_CHANGED) {
          args.handleSuccess = () => notifications.changedWaitinglist(member, params.newDesiredRoomTypes.map(name => roomOptions.informationFor(name, 'waitinglist')));
        }
        saveCommandProcessor(args);
      }
    );
  },

  addParticipantPairFor: function addParticipantPairFor(params, callback) {

    const validationErrors = validate({nickname1: params.participant1Nick, nickname2: params.participant2Nick, roomType: params.roomType});
    if (validationErrors) { return callback(validationErrors); }

    async.series(
      [
        R.partial(memberstore.getMember, [params.participant1Nick]),
        R.partial(memberstore.getMember, [params.participant2Nick]),
        R.partial(eventstoreService.getRoomsCommandProcessor, [currentUrl]).bind(eventstoreService)
      ],
      (err, results) => {
        if (err) { return callback(err); }
        const participant1 = results[0];
        const participant2 = results[1];
        const roomsCommandProcessor = results[2];
        if (!roomsCommandProcessor || !participant1 || !participant2) { return callback(); }

        const events = roomsCommandProcessor.addParticipantPairFor(params.roomType, participant1.id(), participant2.id());

        const args = {commandProcessor: roomsCommandProcessor, events, callback};
        if (events.length === 1 && events[0].event === e.ROOM_PAIR_WAS_ADDED) {
          args.handleSuccess = () => notifications.addedParticipantPair(participant1, participant2);
        }
        saveCommandProcessor(args);
      }
    );
  },

  removeParticipantPairFor: function removeParticipantPairFor(params, callback) {

    const validationErrors = validate({nickname1: params.participant1Nick, nickname2: params.participant2Nick, roomType: params.roomType});
    if (validationErrors) { return callback(validationErrors); }

    async.series(
      [
        R.partial(memberstore.getMember, [params.participant1Nick]),
        R.partial(memberstore.getMember, [params.participant2Nick]),
        R.partial(eventstoreService.getRoomsCommandProcessor, [currentUrl]).bind(eventstoreService)
      ],
      (err, results) => {
        if (err) { return callback(err); }
        const participant1 = results[0];
        const participant2 = results[1];
        const roomsCommandProcessor = results[2];
        if (!roomsCommandProcessor || !participant1 || !participant2) { return callback(); }

        const events = roomsCommandProcessor.removeParticipantPairFor(params.roomType, participant1.id(), participant2.id());

        const args = {commandProcessor: roomsCommandProcessor, events, callback};
        if (events.length === 1 && events[0].event === e.ROOM_PAIR_WAS_REMOVED) {
          args.handleSuccess = () => notifications.removedParticipantPair(participant1, participant2);
        }
        saveCommandProcessor(args);
      }
    );
  },

  removeParticipantFor: function removeParticipantFor(params, callback) {

    const validationErrors = validate({nickname: params.participantNick, roomType: params.roomType});
    if (validationErrors) { return callback(validationErrors); }

    async.series(
      [
        R.partial(memberstore.getMember, [params.participantNick]),
        R.partial(eventstoreService.getRoomsCommandProcessor, [currentUrl]).bind(eventstoreService),
        R.partial(eventstoreService.getRegistrationCommandProcessor, [currentUrl]).bind(eventstoreService)
      ],
      (err, results) => {
        if (err) { return callback(err); }
        const participant = results[0];
        const roomsCommandProcessor = results[1];
        const registrationCommandProcessor = results[2];
        if (!roomsCommandProcessor || !registrationCommandProcessor || !participant) { return callback(); }

        const roomsEvents = roomsCommandProcessor.removeParticipantPairContaining(params.roomType, participant.id());
        const registrationEvent = registrationCommandProcessor.removeParticipant(params.roomType, participant.id());

        const args = {commandProcessor: [roomsCommandProcessor, registrationCommandProcessor], events: [roomsEvents, [registrationEvent]], callback};

        if (registrationEvent.event === e.PARTICIPANT_WAS_REMOVED) {
          args.handleSuccess = () => notifications.removedFromParticipants(participant);
        }
        saveCommandProcessor(args);
      }
    );
  },

  removeWaitinglistMemberFor: function removeWaitinglistMemberFor(params, callback) {

    const validationErrors = validate({nickname: params.waitinglistMemberNick, roomTypes: params.desiredRoomTypes});
    if (validationErrors) { return callback(validationErrors); }

    async.series(
      [
        R.partial(memberstore.getMember, [params.waitinglistMemberNick]),
        R.partial(eventstoreService.getRegistrationCommandProcessor, [currentUrl]).bind(eventstoreService)
      ],
      (err, results) => {
        if (err) { return callback(err); }
        const waitinglistMember = results[0];
        const registrationCommandProcessor = results[1];
        if (!registrationCommandProcessor || !waitinglistMember) { return callback(); }

        const event = registrationCommandProcessor.removeWaitinglistParticipant(params.desiredRoomTypes, waitinglistMember.id());

        const args = {commandProcessor: registrationCommandProcessor, events: [event], callback};

        if (event.event === e.WAITINGLIST_PARTICIPANT_WAS_REMOVED) {
          args.handleSuccess = () => notifications.removedFromWaitinglist(waitinglistMember);
        }
        saveCommandProcessor(args);
      }
    );
  }
};
