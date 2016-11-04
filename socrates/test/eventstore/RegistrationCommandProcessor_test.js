/*eslint no-underscore-dangle: 0*/
'use strict';

const expect = require('must-dist');
const moment = require('moment-timezone');
const R = require('ramda');

const beans = require('../../testutil/configureForTest').get('beans');
const events = beans.get('events');
const RegistrationWriteModel = beans.get('RegistrationWriteModel');
const RegistrationReadModel = beans.get('RegistrationReadModel');
const SoCraTesReadModel = beans.get('SoCraTesReadModel');
const RegistrationCommandProcessor = beans.get('RegistrationCommandProcessor');
const e = beans.get('eventConstants');

function stripTimestamps(someEvents) {
  return someEvents.map((event) => {
    const newEvent = R.clone(event);
    delete newEvent.timestamp;
    return newEvent;
  });
}

const aLongTimeAgo = moment.tz().subtract(40, 'minutes');
const aShortTimeAgo = moment.tz().subtract(10, 'minutes');
const aShorterTimeAgo = moment.tz().subtract(5, 'minutes');

const sessionId1 = 'session-id-1';
const sessionId2 = 'session-id-2';
const singleBedRoom = 'single';
const bedInDouble = 'bed_in_double';
const junior = 'junior';
const untilSaturday = 'untilSaturday';
const untilSundayMorning = 'untilSundayMorning';
const untilSundayEvening = 'untilSundayEvening';
const memberId1 = 'member-id-1';
const memberId2 = 'member-id-2';

const url = 'socrates-url';

describe('The registration command processor', () => {

  let listOfEvents;

  beforeEach(() => {
    listOfEvents = [];
  });

  describe('for removing registrations (removeParticipant)', () => {
    it('removes a participant', () => {
      //Given (saved events)
      listOfEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aShortTimeAgo)];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      //When (issued command)
      const event = commandProcessor.removeParticipant(singleBedRoom, memberId1);

      //Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {event: e.PARTICIPANT_WAS_REMOVED, roomType: singleBedRoom, memberId: memberId1}
      ]);
    });

    it('removes no participant when not registered', () => {
      //Given (saved events)
      listOfEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId2, aShortTimeAgo)];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      //When (issued command)
      const event = commandProcessor.removeParticipant(singleBedRoom, memberId1);

      //Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.DID_NOT_REMOVE_PARTICIPANT_BECAUSE_THEY_ARE_NOT_REGISTERED,
          roomType: singleBedRoom,
          memberId: memberId1
        }
      ]);
    });

    it('doesnt remove the participant because its not the right room', () => {
      //Given (saved events)
      listOfEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aShortTimeAgo)];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      //When (issued command)
      const event = commandProcessor.removeParticipant(bedInDouble, memberId1);

      //Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.DID_NOT_REMOVE_PARTICIPANT_BECAUSE_THEY_ARE_NOT_REGISTERED_FOR_THIS_ROOM_TYPE,
          roomType: bedInDouble,
          memberId: memberId1
        }
      ]);
    });
  });

  describe('for removing a waitinglist Participant (removeWaitinglistParticipant)', () => {
    it('removes a waitinglist participant', () => {
      //Given (saved events)
      listOfEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId1, memberId1, aLongTimeAgo)
      ];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      //When (issued commamnd)
      const event = commandProcessor.removeWaitinglistParticipant([singleBedRoom], memberId1, aShortTimeAgo);

      //Then (saved events)
      expect(stripTimestamps([event])).to.eql([
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REMOVED, desiredRoomTypes: [singleBedRoom], memberId: memberId1}
      ]);
    });

    it('does not remove waitinglist participant because he is not registered', () => {
      //Given (saved events)
      listOfEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId2, memberId2, aLongTimeAgo)
      ];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      //When (issued command)
      const event = commandProcessor.removeWaitinglistParticipant([singleBedRoom], memberId1);

      //Then (saved events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.DID_NOT_REMOVE_WAITINGLIST_PARTICIPANT_BECAUSE_THEY_ARE_NOT_REGISTERED,
          desiredRoomTypes: [singleBedRoom],
          memberId: memberId1
        }
      ]);
    });

    it('removes waitinglist participant even if the rooms do not match', () => {
      //Given (saved events)
      listOfEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom, bedInDouble], 2, sessionId1, memberId1, aLongTimeAgo)
      ];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      //When (issued commands)
      const event = commandProcessor.removeWaitinglistParticipant([bedInDouble], memberId1);

      //Then (saved events)
      expect(stripTimestamps([event])).to.eql([
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REMOVED, desiredRoomTypes: [bedInDouble], memberId: memberId1}]);
    });
  });

  describe('for changing the desired room types (changeDesiredRoomTypes)', () => {
    it('changed the desired room types', () => {
      //Given (saved events)
      listOfEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId1, memberId1, aLongTimeAgo)
      ];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      //When (issued command)
      const event = commandProcessor.changeDesiredRoomTypes(memberId1, [bedInDouble]);

      //Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.DESIRED_ROOM_TYPES_WERE_CHANGED,
          desiredRoomTypes: [bedInDouble],
          memberId: memberId1,
          joinedWaitinglist: aLongTimeAgo.valueOf()
        }
      ]);
    });

    it('does not change the desired room types because participant is not on waitinglist', () => {
      //Given (saved events)
      listOfEvents = [];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      //When (issued command)
      const event = commandProcessor.changeDesiredRoomTypes(memberId1, [bedInDouble]);

      //Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.DID_NOT_CHANGE_DESIRED_ROOM_TYPES_BECAUSE_PARTICIPANT_IS_NOT_ON_WAITINGLIST,
          desiredRoomTypes: [bedInDouble],
          memberId: memberId1
        }
      ]);
    });

    it('does not change the desired room types because it would not change anything', () => {
      //Given (saved events)
      listOfEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId1, memberId1, aLongTimeAgo)
      ];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      //When (issued command)
      const event = commandProcessor.changeDesiredRoomTypes(memberId1, [singleBedRoom]);

      //Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.DID_NOT_CHANGE_DESIRED_ROOM_TYPES_BECAUSE_THERE_WAS_NO_CHANGE,
          desiredRoomTypes: [singleBedRoom],
          memberId: memberId1
        }
      ]);
    });
  });

  describe('for room type changes (moveParticipantToNewRoomType)', () => {
    it('moves the participant to the new room type without caring about the new room limit', () => {
      // Given (saved events)
      listOfEvents = [
        events.roomQuotaWasSet(bedInDouble, 0),
        //events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, memberId1, aShortTimeAgo),
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aShortTimeAgo)];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      // When (issued command)
      const event = commandProcessor.moveParticipantToNewRoomType(memberId1, bedInDouble);

      // Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.ROOM_TYPE_WAS_CHANGED,
          memberId: memberId1,
          roomType: bedInDouble,
          duration: untilSaturday,
          joinedSoCraTes: aShortTimeAgo.valueOf()
        }]);
    });

    it('multiple room changes keep moving the participant to the new room types', () => {
      // Given (saved events)
      listOfEvents = [
        events.roomQuotaWasSet(bedInDouble, 0),
        //events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, memberId1, aShortTimeAgo),
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aShortTimeAgo),
        events.roomTypeWasChanged(memberId1, bedInDouble, untilSaturday, aShortTimeAgo)
      ];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      // When (issued command)
      const event = commandProcessor.moveParticipantToNewRoomType(memberId1, junior);

      // Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.ROOM_TYPE_WAS_CHANGED,
          memberId: memberId1,
          roomType: junior,
          duration: untilSaturday,
          joinedSoCraTes: aShortTimeAgo.valueOf()
        }
      ]);
    });

    it('appends an error event if the member has not actually been a participant', () => {
      // Given (saved events)
      listOfEvents = [events.roomQuotaWasSet(bedInDouble, 10)];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      // When (issued command)
      const event = commandProcessor.moveParticipantToNewRoomType(memberId1, bedInDouble);

      // Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {event: e.DID_NOT_CHANGE_ROOM_TYPE_FOR_NON_PARTICIPANT, memberId: memberId1, roomType: bedInDouble}]);
    });
  });

  describe('for duration changes (setNewDurationForParticipant)', () => {
    it('moves the participant to the new duration', () => {
      // Given (saved events)
      listOfEvents = [
        events.roomQuotaWasSet(singleBedRoom, 10),
        //events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, memberId1, aLongTimeAgo),
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aShortTimeAgo)];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      // When (issued command)
      const event = commandProcessor.setNewDurationForParticipant(memberId1, untilSundayMorning);

      // Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.DURATION_WAS_CHANGED,
          memberId: memberId1,
          roomType: singleBedRoom,
          duration: untilSundayMorning,
          joinedSoCraTes: aShortTimeAgo.valueOf()
        }]);
    });

    it('multiple duration changes keep moving the participant to the new duration', () => {
      // Given (saved events)
      listOfEvents = [
        events.roomQuotaWasSet(bedInDouble, 0),
        //events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, memberId1, aLongTimeAgo),
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aShortTimeAgo),
        events.durationWasChanged(memberId1, singleBedRoom, untilSundayMorning, aShortTimeAgo)
      ];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      // When (issued command)
      const event = commandProcessor.setNewDurationForParticipant(memberId1, untilSundayEvening);

      // Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.DURATION_WAS_CHANGED,
          memberId: memberId1,
          roomType: singleBedRoom,
          duration: untilSundayEvening,
          joinedSoCraTes: aShortTimeAgo.valueOf()
        }
      ]);
    });

    it('appends an error event if the member has not actually been a participant', () => {
      // Given (saved events)
      listOfEvents = [events.roomQuotaWasSet(bedInDouble, 10)];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      // When (issued command)
      const event = commandProcessor.setNewDurationForParticipant(memberId1, untilSaturday);

      // Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {event: e.DID_NOT_CHANGE_DURATION_FOR_NON_PARTICIPANT, memberId: memberId1, duration: untilSaturday}]);
    });
  });

  describe('for waitinglist reservations (issueWaitinglistReservation)', () => {
    it('reserves a spot on the waitinglist', () => {
      // Given (saved events)
      listOfEvents = [];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));
      // When (issued command)
      const event = commandProcessor.issueWaitinglistReservation([singleBedRoom], 2, sessionId1, memberId1, aShortTimeAgo);

      // Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.WAITINGLIST_RESERVATION_WAS_ISSUED,
          duration: 2,
          sessionId: sessionId1,
          memberId: memberId1,
          desiredRoomTypes: [singleBedRoom],
          joinedWaitinglist: aShortTimeAgo.valueOf()
        }]);
    });

    it('reserves a spot on the waitinglist when an expired reservation (from somebody else) exists', () => {
      // Given (saved events)
      listOfEvents = [
        events.waitinglistReservationWasIssued([singleBedRoom], 3, sessionId1, memberId1, aLongTimeAgo)];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      // When (issued command)
      const event = commandProcessor.issueWaitinglistReservation([singleBedRoom], 2, sessionId2, memberId2, aShorterTimeAgo);

      // Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.WAITINGLIST_RESERVATION_WAS_ISSUED,
          duration: 2,
          sessionId: sessionId2,
          memberId: memberId2,
          desiredRoomTypes: [singleBedRoom],
          joinedWaitinglist: aShorterTimeAgo.valueOf()
        }]);
    });

    it('disregards a reservation if there is a matching booking', () => {
      // Given (saved events)
      listOfEvents = [
        events.waitinglistReservationWasIssued([singleBedRoom], 2, sessionId1, memberId1, aShortTimeAgo),
        events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId1, memberId1, aLongTimeAgo)];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      // When (issued command)
      const event = commandProcessor.issueWaitinglistReservation([singleBedRoom], 3, sessionId2, memberId2, aShorterTimeAgo);

      // Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.WAITINGLIST_RESERVATION_WAS_ISSUED,
          duration: 3,
          sessionId: sessionId2,
          memberId: memberId2,
          desiredRoomTypes: [singleBedRoom],
          joinedWaitinglist: aShorterTimeAgo.valueOf()
        }]);
    });

    it('does not allow a registration for any resource if there is already an active registration for the same session id', () => {
      // Given (saved events)
      listOfEvents = [
        events.waitinglistReservationWasIssued([singleBedRoom], 2, sessionId1, memberId1, aShortTimeAgo)];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      // When (issued command)
      const event = commandProcessor.issueWaitinglistReservation([bedInDouble], 3, sessionId1, memberId1, aShorterTimeAgo);

      // Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.DID_NOT_ISSUE_WAITINGLIST_RESERVATION_FOR_ALREADY_RESERVED_SESSION,
          sessionId: sessionId1,
          memberId: memberId1,
          desiredRoomTypes: [bedInDouble]
        }]);
    });

    it('reserves a spot on the waitinglist for multiple rooms', () => {
      // Given (saved events)
      listOfEvents = [];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      // When (issued command)
      const event = commandProcessor.issueWaitinglistReservation([singleBedRoom, bedInDouble], 2, sessionId1, memberId1, aShortTimeAgo);

      // Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.WAITINGLIST_RESERVATION_WAS_ISSUED,
          duration: 2,
          sessionId: sessionId1,
          memberId: memberId1,
          desiredRoomTypes: [singleBedRoom, bedInDouble],
          joinedWaitinglist: aShortTimeAgo.valueOf()
        }]);
    });

  });

  describe('for waitinglist registrations (registerWaitinglistParticipant)', () => {
    it('registers a spot on the waitinglist', () => {
      // Given (saved events)
      listOfEvents = [
        events.waitinglistReservationWasIssued([singleBedRoom], 3, sessionId1, memberId1, aShortTimeAgo)];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      // When (issued command)
      const event = commandProcessor.registerWaitinglistParticipant([singleBedRoom], sessionId1, memberId1);

      // Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
          sessionId: sessionId1,
          desiredRoomTypes: [singleBedRoom],
          duration: 3,
          memberId: memberId1,
          joinedWaitinglist: aShortTimeAgo.valueOf()
        }]);
    });

    it('does not register a spot on the waitinglist if there was an expired reservation', () => { // TODO books a room?
      // Given (saved events)
      listOfEvents = [
        events.waitinglistReservationWasIssued([singleBedRoom], 2, sessionId1, memberId1, aLongTimeAgo)];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      // When (issued command)
      const event = commandProcessor.registerWaitinglistParticipant([singleBedRoom], sessionId1, memberId1);

      // Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.DID_NOT_REGISTER_WAITINGLIST_PARTICIPANT_WITH_EXPIRED_OR_MISSING_RESERVATION,
          sessionId: sessionId1,
          desiredRoomTypes: [singleBedRoom],
          memberId: memberId1
        }]);
    });

    it('does not register a spot on the waitinglist if there was no reservation', () => { // TODO books a room?
      // Given (saved events)
      listOfEvents = [];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      // When (issued command)
      const event = commandProcessor.registerWaitinglistParticipant([singleBedRoom], sessionId1, memberId1);

      // Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.DID_NOT_REGISTER_WAITINGLIST_PARTICIPANT_WITH_EXPIRED_OR_MISSING_RESERVATION,
          sessionId: sessionId1,
          desiredRoomTypes: [singleBedRoom],
          memberId: memberId1
        }]);
    });

    it('does not register the participant again if already registered', () => {
      //Given (saved events)
      listOfEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId1, memberId1, aLongTimeAgo)
      ];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      //When (issued command)
      const event = commandProcessor.registerWaitinglistParticipant([singleBedRoom], sessionId1, memberId1);

      //Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.DID_NOT_REGISTER_WAITINGLIST_PARTICIPANT_A_SECOND_TIME,
          desiredRoomTypes: [singleBedRoom],
          sessionId: sessionId1,
          memberId: memberId1
        }]);
    });

    it('does not register waitinglist participant a second time, even if the desired room types differ', () => {
      //Given (saved events)
      listOfEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId1, memberId1, aLongTimeAgo)
      ];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      //When (issued command)
      const event = commandProcessor.registerWaitinglistParticipant([singleBedRoom, bedInDouble], sessionId1, memberId1);

      //Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.DID_NOT_REGISTER_WAITINGLIST_PARTICIPANT_A_SECOND_TIME,
          desiredRoomTypes: [singleBedRoom, bedInDouble],
          sessionId: sessionId1,
          memberId: memberId1
        }]);
    });

    it('registers a spot on the waitinglist for multiple desired rooms', () => {
      // Given (saved events)
      listOfEvents = [
        events.waitinglistReservationWasIssued([singleBedRoom, bedInDouble], 3, sessionId1, memberId1, aShortTimeAgo)];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      // When (issued command)
      const event = commandProcessor.registerWaitinglistParticipant([singleBedRoom, bedInDouble], sessionId1, memberId1);

      // Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
          sessionId: sessionId1,
          desiredRoomTypes: [singleBedRoom, bedInDouble],
          duration: 3,
          memberId: memberId1,
          joinedWaitinglist: aShortTimeAgo.valueOf()
        }]);
    });
  });

  describe('for registering participants from the waitinglist (fromWaitinglistToParticipant)', () => {
    it('does not register a participant if he is not on the waitinglist', () => {
      //Given (saved events)
      listOfEvents = [];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      //When (issued command)
      const event = commandProcessor.fromWaitinglistToParticipant(singleBedRoom, memberId1, aShortTimeAgo);

      //Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.DID_NOT_REGISTER_PARTICIPANT_FROM_WAITINGLIST_BECAUSE_THEY_WERE_NOT_ON_WAITINGLIST,
          roomType: singleBedRoom,
          memberId: memberId1
        }
      ]);
    });

    it('registers a participant who is on the waitinglist', () => {
      //Given (saved events)
      listOfEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom, bedInDouble], 3, sessionId1, memberId1, aLongTimeAgo)
      ];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      //When (issued command)
      const event = commandProcessor.fromWaitinglistToParticipant(singleBedRoom, memberId1, aShortTimeAgo);

      //Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST,
          roomType: singleBedRoom,
          memberId: memberId1,
          duration: 3,
          joinedSoCraTes: aShortTimeAgo.valueOf()
        }
      ]);
    });

    it('does not register the participant again if he is already registered', () => {
      //Given (saved events)
      listOfEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom, bedInDouble], 2, sessionId1, memberId1, aLongTimeAgo),
        events.registeredParticipantFromWaitinglist(singleBedRoom, 2, memberId1, aShortTimeAgo)
      ];
      const commandProcessor = new RegistrationCommandProcessor(new RegistrationWriteModel(url, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents))));

      //When (issued command)
      const event = commandProcessor.fromWaitinglistToParticipant(singleBedRoom, memberId1, aShorterTimeAgo);

      //Then (new events)
      expect(stripTimestamps([event])).to.eql([
        {
          event: e.DID_NOT_REGISTER_PARTICIPANT_FROM_WAITINGLIST_A_SECOND_TIME,
          memberId: memberId1,
          roomType: singleBedRoom
        }
      ]);
    });
  });
});
