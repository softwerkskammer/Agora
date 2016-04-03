/*eslint no-underscore-dangle: 0*/
'use strict';

var expect = require('must-dist');
var moment = require('moment-timezone');
var _ = require('lodash');
var R = require('ramda');

var beans = require('../../testutil/configureForTest').get('beans');
var events = beans.get('events');
var GlobalEventStore = beans.get('GlobalEventStore');
var RegistrationWriteModel = beans.get('RegistrationWriteModel');
var RegistrationCommandProcessor = beans.get('RegistrationCommandProcessor');
var e = beans.get('eventConstants');

function stripTimestamps(someEvents) {
  return _.map(someEvents, function (event) {
    var newEvent = R.clone(event);
    delete newEvent.timestamp;
    return newEvent;
  });
}

var aLongTimeAgo = moment.tz().subtract(40, 'minutes');
var aShortTimeAgo = moment.tz().subtract(10, 'minutes');

var sessionId1 = 'session-id-1';
var sessionId2 = 'session-id-2';
var singleBedRoom = 'singleBedRoom';
var bedInDouble = 'bedInDouble';
var kingSuite = 'kingSuite';
var untilSaturday = 'untilSaturday';
var untilSundayMorning = 'untilSundayMorning';
var untilSundayEvening = 'untilSundayEvening';
var memberId1 = 'member-id-1';
var memberId2 = 'member-id-2';

function setTimestamp(event, timestamp) {
  event.timestamp = timestamp;
  return event;
}

describe('The registration command processor', function () {

  var eventStore;
  var commandProcessor;

  beforeEach(function () {
    eventStore = new GlobalEventStore();
    commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(eventStore));
  });

  describe('for room reservations (issueReservation)', function () {
    it('reserves a room if the quota is not yet exceeded', function () {
      // Given (saved events)
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 100)];
      eventStore.state.registrationEvents = [];

      // When (issued command)
      commandProcessor.issueReservation(singleBedRoom, untilSaturday, sessionId1);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday}]);
    });

    it('does not reserve a room if the quota is already exhausted by an active reservation', function () {
      // Given (saved events)
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 1)];
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, aShortTimeAgo)];

      // When (issued command)
      commandProcessor.issueReservation(singleBedRoom, untilSundayMorning, sessionId2);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
        {
          event: e.DID_NOT_ISSUE_RESERVATION_FOR_FULL_RESOURCE,
          sessionID: sessionId2,
          roomType: singleBedRoom,
          duration: untilSundayMorning
        }
      ]);
    });

    it('reserves a room when an expired reservation exists', function () {
      // Given (saved events)
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 1)];
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1), aLongTimeAgo)];

      // When (issued command)
      commandProcessor.issueReservation(singleBedRoom, untilSundayMorning, sessionId2);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
        {
          event: e.RESERVATION_WAS_ISSUED,
          sessionID: sessionId2,
          roomType: singleBedRoom,
          duration: untilSundayMorning
        }]);
    });

    it('does not reserve a room if the quota is already exhausted by a registration', function () {
      // Given (saved events)
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 1)];
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, aShortTimeAgo),
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1)];

      // When (issued command)
      commandProcessor.issueReservation(singleBedRoom, untilSaturday, sessionId2);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
        {
          event: e.PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId1,
          memberId: memberId1,
          roomType: singleBedRoom,
          duration: untilSaturday
        },
        {
          event: e.DID_NOT_ISSUE_RESERVATION_FOR_FULL_RESOURCE,
          sessionID: sessionId2,
          roomType: singleBedRoom,
          duration: untilSaturday
        }
      ]);
    });

    it('does not count a reservation and its matching booking towards the quota', function () {
      // Given (saved events)
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 2)];
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, aShortTimeAgo),
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1)];

      // When (issued command)
      commandProcessor.issueReservation(singleBedRoom, untilSaturday, sessionId2);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
        {
          event: e.PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId1,
          memberId: memberId1,
          roomType: singleBedRoom,
          duration: untilSaturday
        },
        {event: e.RESERVATION_WAS_ISSUED, sessionID: sessionId2, roomType: singleBedRoom, duration: untilSaturday}]);
    });

    it('does not allow a registration for any resource if there is already an active registration for the same session id', function () {
      // Given (saved events)
      eventStore.state.socratesEvents = [
        events.roomQuotaWasSet(singleBedRoom, 100),
        events.roomQuotaWasSet(bedInDouble, 100)];
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, aShortTimeAgo)];

      // When (issued command)
      commandProcessor.issueReservation(bedInDouble, untilSaturday, sessionId1);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
        {
          event: e.DID_NOT_ISSUE_RESERVATION_FOR_ALREADY_RESERVED_SESSION,
          sessionID: sessionId1,
          roomType: bedInDouble,
          duration: untilSaturday
        }]);
    });
  });

  describe('for room registrations (registerParticipant)', function () {

    it('registers a room', function () { // TODO books a room?
      // Given (saved events)
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 100)];
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, aShortTimeAgo)];

      // When (issued command)
      commandProcessor.registerParticipant(singleBedRoom, untilSaturday, sessionId1, memberId1);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
        {
          event: e.PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId1,
          roomType: singleBedRoom,
          duration: untilSaturday,
          memberId: memberId1
        }]);
    });

    it('registers a room even if the matching reservation filled up the room', function () { // TODO books a room?
      // Given (saved events)
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 1)];
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, aShortTimeAgo)];

      // When (issued command)
      commandProcessor.registerParticipant(singleBedRoom, untilSaturday, sessionId1, memberId1);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
        {
          event: e.PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId1,
          roomType: singleBedRoom,
          duration: untilSaturday,
          memberId: memberId1
        }]);
    });

    it('registers a room for the given duration even if the reservation was for a different duration', function () { // TODO books a room?
      // Given (saved events)
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 100)];
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, untilSundayMorning, sessionId1, aShortTimeAgo)];

      // When (issued command)
      commandProcessor.registerParticipant(singleBedRoom, untilSaturday, sessionId1, memberId1);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSundayMorning},
        {
          event: e.PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId1,
          roomType: singleBedRoom,
          duration: untilSaturday,
          memberId: memberId1
        }]);
    });

    it('registers a room even if there was an expired reservation, if there was enough space', function () { // TODO books a room?
      // Given (saved events)
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 1)];
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, aLongTimeAgo)];

      // When (issued command)
      commandProcessor.registerParticipant(singleBedRoom, untilSaturday, sessionId1, memberId1);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
        {
          event: e.PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId1,
          roomType: singleBedRoom,
          duration: untilSaturday,
          memberId: memberId1
        }]);
    });

    it('does not register a room if there was an expired reservation but if there was not enough space', function () { // TODO books a room?
      // Given (saved events)
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 1)];
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1), aLongTimeAgo),
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId2, memberId2)];

      // When (issued command)
      commandProcessor.registerParticipant(singleBedRoom, untilSaturday, sessionId1, memberId1);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
        {
          event: e.PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId2,
          roomType: singleBedRoom,
          duration: untilSaturday,
          memberId: memberId2
        },
        {
          event: e.DID_NOT_REGISTER_PARTICIPANT_FOR_FULL_RESOURCE,
          sessionID: sessionId1,
          roomType: singleBedRoom,
          duration: untilSaturday,
          memberId: memberId1
        }
      ]);
    });

    it('registers a room even if there was no reservation, if there was enough space', function () { // TODO books a room?
      // Given (saved events)
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 100)];
      eventStore.state.registrationEvents = [];

      // When (issued command)
      commandProcessor.registerParticipant(singleBedRoom, untilSaturday, sessionId1, memberId1);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {
          event: e.PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId1,
          roomType: singleBedRoom,
          duration: untilSaturday,
          memberId: memberId1
        }]);
    });

    it('does not register two rooms for the same member, not even different rooms', function () { // TODO books a room?
      // Given (saved events)
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 100)];
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1)
      ];

      // When (issued command)
      commandProcessor.registerParticipant(bedInDouble, untilSaturday, sessionId1, memberId1);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {
          event: e.PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId1,
          roomType: singleBedRoom,
          duration: untilSaturday,
          memberId: memberId1
        },
        {
          event: e.DID_NOT_REGISTER_PARTICIPANT_A_SECOND_TIME,
          sessionID: sessionId1,
          roomType: bedInDouble,
          duration: untilSaturday,
          memberId: memberId1
        }
      ]);
    });
  });

  describe('for removing registrations (removeParticipant)', function () {
    it('removes a participant', function () {
      //Given (saved events)
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aShortTimeAgo)];

      //When (issued command)
      commandProcessor.removeParticipant(singleBedRoom, memberId1);

      //Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday, memberId: memberId1},
        {event: e.PARTICIPANT_WAS_REMOVED, roomType: singleBedRoom, memberId: memberId1}
      ]);
    });
    it('removes no participant when not registered', function () {
      //Given (saved events)
      eventStore.state.registrationEvents = [events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId2, aShortTimeAgo)];

      //When (issued command)
      commandProcessor.removeParticipant(singleBedRoom, memberId1);

      //Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday, memberId: memberId2},
        {event: e.DID_NOT_REMOVE_PARTICIPANT_BECAUSE_THEY_ARE_NOT_REGISTERED, roomType: singleBedRoom, memberId: memberId1}
      ]);
    });
    it('doesnt remove the participant because its not the right room', function () {
      //Given (saved events)
      eventStore.state.registrationEvents = [events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aShortTimeAgo)];

      //When (issued command)
      commandProcessor.removeParticipant(bedInDouble, memberId1);

      //Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday, memberId: memberId1},
        {event: e.DID_NOT_REMOVE_PARTICIPANT_BECAUSE_THEY_ARE_NOT_REGISTERED_FOR_THIS_ROOM_TYPE, roomType: bedInDouble, memberId: memberId1}
      ]);
    });
  });

  describe('for removing a waitinglist Participant (removeWaitinglistParticipant)', function () {
    xit('removes a waitinglist participant', function () {
      //Given (saved events)
      eventStore.state.registrationEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId1, memberId1)
      ];
      //When (issued commamnd)
      commandProcessor.removeWaitinglistParticipant([singleBedRoom], sessionId1, memberId1);

      //Then (saved events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, desiredRoomTypes: [singleBedRoom], sessionID: sessionId1, memberId: memberId1},
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REMOVED, desiredRoomTypes: [singleBedRoom], memberId: memberId1}
      ]);
    });
    it('does not remove waitinglist participant because he is not registered', function () {
      //Given (saved events)
      eventStore.state.registrationEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId2, memberId2)
      ];

      //When (issued command)
      commandProcessor.removeWaitinglistParticipant([singleBedRoom], memberId1);

      //Then (saved events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, desiredRoomTypes: [singleBedRoom], sessionID: sessionId2, memberId: memberId2},
        {event: e.DID_NOT_REMOVE_WAITINGLIST_PARTICIPANT_BECAUSE_THEY_ARE_NOT_REGISTERED, desiredRoomTypes: [singleBedRoom], memberId: memberId1}
      ]);
    });
    it('does only remove waitinglist participant from one of two rooms', function () {
      //Given (saved events)
      eventStore.state.registrationEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom, bedInDouble], sessionId1, memberId1)
      ];

      //When (issued commands)
      commandProcessor.removeWaitinglistParticipant([bedInDouble], memberId1);

      //Then (saved events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, desiredRoomTypes: [singleBedRoom, bedInDouble], sessionID: sessionId1, memberId: memberId1},
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REMOVED, desiredRoomTypes: [bedInDouble], memberId: memberId1}]);
    });
  });

  describe('for changing the desired room types (changeDesiredRoomTypes)', function () {
    it('changed the desired room types', function () {
      //Given (saved events)
      eventStore.state.registrationEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId1, memberId1)
      ];

      //When (issued command)
      commandProcessor.changeDesiredRoomTypes(memberId1, [bedInDouble]);

      //Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, desiredRoomTypes: [singleBedRoom], sessionID: sessionId1, memberId: memberId1},
        {event: e.DESIRED_ROOM_TYPES_WERE_CHANGED, desiredRoomTypes: [bedInDouble], memberId: memberId1}
      ]);
    });
    it('does not change the desired room types because participant is not on waitinglist', function () {
      //Given (saved events)
      eventStore.state.registrationEvents = [];

      //When (issued command)
      commandProcessor.changeDesiredRoomTypes(memberId1, [bedInDouble]);

      //Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.DID_NOT_CHANGE_DESIRED_ROOM_TYPES_BECAUSE_PARTICIPANT_IS_NOT_ON_WAITINGLIST, desiredRoomTypes: [bedInDouble], memberId: memberId1}
      ]);
    });
    it('does not change the desired room types cause it would not change anything', function () {
      //Given (saved events)
      eventStore.state.registrationEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId1, memberId1)
      ];

      //When (issued command)
      commandProcessor.changeDesiredRoomTypes(memberId1, [singleBedRoom]);

      //Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, desiredRoomTypes: [singleBedRoom], sessionID: sessionId1, memberId: memberId1},
        {event: e.DID_NOT_CHANGE_DESIRED_ROOM_TYPES_BECAUSE_THERE_WAS_NO_CHANGE, desiredRoomTypes: [singleBedRoom], memberId: memberId1}
      ]);
    });
  });

  describe('for room type changes (moveParticipantToNewRoomType)', function () {
    it('moves the participant to the new room type without caring about the new room limit', function () {
      // Given (saved events)
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(bedInDouble, 0)];
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, aLongTimeAgo),
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aShortTimeAgo)];

      // When (issued command)
      commandProcessor.moveParticipantToNewRoomType(memberId1, bedInDouble);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday, memberId: memberId1},
        {event: e.ROOM_TYPE_WAS_CHANGED, memberId: memberId1, roomType: bedInDouble, duration: untilSaturday}]);
    });

    it('multiple room changes keep moving the participant to the new room types', function () {
      // Given (saved events)
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(bedInDouble, 0)];
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, aLongTimeAgo),
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aShortTimeAgo),
        events.roomTypeWasChanged(memberId1, bedInDouble, untilSaturday)
      ];

      // When (issued command)
      commandProcessor.moveParticipantToNewRoomType(memberId1, kingSuite);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
        {
          event: e.PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId1,
          roomType: singleBedRoom,
          duration: untilSaturday,
          memberId: memberId1
        },
        {event: e.ROOM_TYPE_WAS_CHANGED, memberId: memberId1, roomType: bedInDouble, duration: untilSaturday},
        {event: e.ROOM_TYPE_WAS_CHANGED, memberId: memberId1, roomType: kingSuite, duration: untilSaturday}
      ]);
    });

    it('appends an error event if the member has not actually been a participant', function () {
      // Given (saved events)
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(bedInDouble, 10)];
      eventStore.state.registrationEvents = [];

      // When (issued command)
      commandProcessor.moveParticipantToNewRoomType(memberId1, bedInDouble);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.DID_NOT_CHANGE_ROOM_TYPE_FOR_NON_PARTICIPANT, memberId: memberId1, roomType: bedInDouble}]);
    });
  });

  describe('for duration changes (setNewDurationForParticipant)', function () {
    it('moves the participant to the new duration', function () {
      // Given (saved events)
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 10)];
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, aLongTimeAgo),
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aShortTimeAgo)];

      // When (issued command)
      commandProcessor.setNewDurationForParticipant(memberId1, untilSundayMorning);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday, memberId: memberId1},
        {event: e.DURATION_WAS_CHANGED, memberId: memberId1, roomType: singleBedRoom, duration: untilSundayMorning}]);
    });

    it('multiple duration changes keep moving the participant to the new duration', function () {
      // Given (saved events)
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(bedInDouble, 0)];
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, aLongTimeAgo),
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aShortTimeAgo),
        events.durationWasChanged(memberId1, singleBedRoom, untilSundayMorning)
      ];

      // When (issued command)
      commandProcessor.setNewDurationForParticipant(memberId1, untilSundayEvening);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
        {
          event: e.PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId1,
          roomType: singleBedRoom,
          duration: untilSaturday,
          memberId: memberId1
        },
        {event: e.DURATION_WAS_CHANGED, memberId: memberId1, roomType: singleBedRoom, duration: untilSundayMorning},
        {event: e.DURATION_WAS_CHANGED, memberId: memberId1, roomType: singleBedRoom, duration: untilSundayEvening}
      ]);
    });

    it('appends an error event if the member has not actually been a participant', function () {
      // Given (saved events)
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(bedInDouble, 10)];
      eventStore.state.registrationEvents = [];

      // When (issued command)
      commandProcessor.setNewDurationForParticipant(memberId1, untilSaturday);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.DID_NOT_CHANGE_DURATION_FOR_NON_PARTICIPANT, memberId: memberId1, duration: untilSaturday}]);
    });
  });

  describe('for registering a waitinglist participant (registerWaitinglistParticipant)', function () {

    it('registers a waitinglist participant', function () {
      //Given (saved events)
      eventStore.state.registrationEvents = [];

      //When (issued command)
      commandProcessor.registerWaitinglistParticipant([singleBedRoom, bedInDouble], sessionId1, memberId1);

      //Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([{
        event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, desiredRoomTypes: [singleBedRoom, bedInDouble], sessionID: sessionId1, memberId: memberId1
      }]);
    });

    xit('does not register the participant again if already registered', function () {
      //Given (saved events)
      eventStore.state.registrationEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId1, memberId1)
      ];

      //When (issued command)
      commandProcessor.registerWaitinglistParticipant([singleBedRoom], sessionId1, memberId1);

      //Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([{
        event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, desiredRoomTypes: [singleBedRoom], sessionID: sessionId1, memberId: memberId1
      },
        {event: e.DID_NOT_REGISTER_PARTICIPANT_A_SECOND_TIME, desiredRoomTypes: [singleBedRoom], sessionID: sessionId1, memberId: memberId1}]);
    });

    xit('does register waitinglist participant for one of two desired room types', function () {
      //Given (saved events)
      eventStore.state.registrationEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId1, memberId1)
      ];

      //When (issued command)
      commandProcessor.registerWaitinglistParticipant([singleBedRoom, bedInDouble], sessionId1, memberId1);

      //Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([{
        event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, desiredRoomTypes: [singleBedRoom], sessionID: sessionId1, memberId: memberId1
      },
        {event: e.DID_NOT_REGISTER_PARTICIPANT_A_SECOND_TIME, desiredRoomTypes: [singleBedRoom], sessionID: sessionId1, memberId: memberId1}]);
    });
  });

  describe('for waitinglist reservations (issueWaitinglistReservation)', function () {
    it('reserves a spot on the waitinglist', function () {
      // Given (saved events)
      eventStore.state.registrationEvents = [];

      // When (issued command)
      commandProcessor.issueWaitinglistReservation([singleBedRoom], sessionId1);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId1, desiredRoomTypes: [singleBedRoom]}]);
    });

    it('reserves a spot on the waitinglist when an expired reservation exists', function () {
      // Given (saved events)
      eventStore.state.registrationEvents = [
        setTimestamp(events.waitinglistReservationWasIssued([singleBedRoom], sessionId1), aLongTimeAgo)];

      // When (issued command)
      commandProcessor.issueWaitinglistReservation([singleBedRoom], sessionId2);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId1, desiredRoomTypes: [singleBedRoom]},
        {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId2, desiredRoomTypes: [singleBedRoom]}]);
    });

    it('disregards a reservation if there is a matching booking', function () {
      // Given (saved events)
      eventStore.state.registrationEvents = [
        events.waitinglistReservationWasIssued([singleBedRoom], sessionId1),
        events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId1, memberId1)];

      // When (issued command)
      commandProcessor.issueWaitinglistReservation([singleBedRoom], sessionId2);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId1, desiredRoomTypes: [singleBedRoom]},
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, memberId: memberId1, desiredRoomTypes: [singleBedRoom]},
        {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId2, desiredRoomTypes: [singleBedRoom]}]);
    });

    it('does not allow a registration for any resource if there is already an active registration for the same session id', function () {
      // Given (saved events)
      eventStore.state.registrationEvents = [
        events.waitinglistReservationWasIssued([singleBedRoom], sessionId1)];

      // When (issued command)
      commandProcessor.issueWaitinglistReservation([bedInDouble], sessionId1);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId1, desiredRoomTypes: [singleBedRoom]},
        {event: e.DID_NOT_ISSUE_WAITINGLIST_RESERVATION_FOR_ALREADY_RESERVED_SESSION, sessionID: sessionId1, desiredRoomTypes: [bedInDouble]}]);
    });
    it('reserves a spot on the waitinglist for multiple rooms', function () {
      // Given (saved events)
      eventStore.state.registrationEvents = [];

      // When (issued command)
      commandProcessor.issueWaitinglistReservation([singleBedRoom, bedInDouble], sessionId1);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId1, desiredRoomTypes: [singleBedRoom, bedInDouble]}]);
    });

  });

  describe('for waitinglist registrations (registerWaitinglistParticipant)', function () {
    it('registers a spot on the waitinglist', function () {
      // Given (saved events)
      eventStore.state.registrationEvents = [
        setTimestamp(events.waitinglistReservationWasIssued([singleBedRoom], sessionId1), aShortTimeAgo)];

      // When (issued command)
      commandProcessor.registerWaitinglistParticipant([singleBedRoom], sessionId1, memberId1);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId1, desiredRoomTypes: [singleBedRoom]},
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, desiredRoomTypes: [singleBedRoom], memberId: memberId1}]);
    });

    it('registers a spot on the waitinglist even if there was an expired reservation', function () { // TODO books a room?
      // Given (saved events)
      eventStore.state.registrationEvents = [
        setTimestamp(events.waitinglistReservationWasIssued([singleBedRoom], sessionId1), aLongTimeAgo)];

      // When (issued command)
      commandProcessor.registerWaitinglistParticipant([singleBedRoom], sessionId1, memberId1);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId1, desiredRoomTypes: [singleBedRoom]},
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, desiredRoomTypes: [singleBedRoom], memberId: memberId1}]);
    });

    it('registers a spot on the waitinglist even if there was no reservation', function () { // TODO books a room?
      // Given (saved events)
      eventStore.state.registrationEvents = [];

      // When (issued command)
      commandProcessor.registerWaitinglistParticipant([singleBedRoom], sessionId1, memberId1);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, desiredRoomTypes: [singleBedRoom], memberId: memberId1}]);
    });

    it('does not register two spots on the waitinglist for the same member, not even for different rooms', function () { // TODO books a room?
      // Given (saved events)
      eventStore.state.registrationEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId1, memberId1)
      ];

      // When (issued command)
      commandProcessor.registerWaitinglistParticipant([bedInDouble], sessionId1, memberId1);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, desiredRoomTypes: [singleBedRoom], memberId: memberId1},
        {event: e.DID_NOT_REGISTER_PARTICIPANT_A_SECOND_TIME, sessionID: sessionId1, roomType: [bedInDouble], duration: 'waitinglist', memberId: memberId1}
      ]);
    });
    it('registers a spot on the waitinglist for multiple desired rooms', function () {
      // Given (saved events)
      eventStore.state.registrationEvents = [
        setTimestamp(events.waitinglistReservationWasIssued([singleBedRoom, bedInDouble], sessionId1), aShortTimeAgo)];

      // When (issued command)
      commandProcessor.registerWaitinglistParticipant([singleBedRoom, bedInDouble], sessionId1, memberId1);

      // Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId1, desiredRoomTypes: [singleBedRoom, bedInDouble]},
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, desiredRoomTypes: [singleBedRoom, bedInDouble], memberId: memberId1}]);
    });
  });

  describe('for registering participants from the waitinglist (fromWaitinglistToParticipant)', function () {
    it('registers a participant even if he is not on the waitinglist', function () {
      //Given (saved events)
      eventStore.state.registrationEvents = [];

      //When (issued command)
      commandProcessor.fromWaitinglistToParticipant(singleBedRoom, memberId1, untilSaturday);

      //Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.PARTICIPANT_WAS_REGISTERED, roomType: singleBedRoom, memberId: memberId1, sessionID: undefined, duration: untilSaturday}
      ]);
    });
    it('registers a participant even if he is on waitinglist', function () {
      //Given (saved events)
      eventStore.state.registrationEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom, bedInDouble], sessionId1, memberId1)
      ];

      //When (issued command)
      commandProcessor.fromWaitinglistToParticipant(singleBedRoom, memberId1, untilSaturday);

      //Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, desiredRoomTypes: [singleBedRoom, bedInDouble], memberId: memberId1},
        {event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, roomType: singleBedRoom, memberId: memberId1, duration: untilSaturday}
      ]);
    });
    it('does not register the participant again if he registered directly', function () {
      //Given (saved events)
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1)
      ];

      //When (issued command)
      commandProcessor.fromWaitinglistToParticipant(singleBedRoom, memberId1, untilSaturday);

      //Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, memberId: memberId1, roomType: singleBedRoom, duration: untilSaturday},
        {event: e.DID_NOT_REGISTER_PARTICIPANT_FROM_WAITINGLIST_A_SECOND_TIME, memberId: memberId1, duration: untilSaturday, roomType: singleBedRoom}
      ]);
    });
    it('does not register the participant again if he registered from the waitinglist', function () {
      //Given (saved events)
      eventStore.state.registrationEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1)
      ];

      //When (issued command)
      commandProcessor.fromWaitinglistToParticipant(singleBedRoom, memberId1, untilSaturday);

      //Then (new events)
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, memberId: memberId1, roomType: singleBedRoom, duration: untilSaturday},
        {event: e.DID_NOT_REGISTER_PARTICIPANT_FROM_WAITINGLIST_A_SECOND_TIME, memberId: memberId1, duration: untilSaturday, roomType: singleBedRoom}
      ]);
    });
  });
});
