'use strict';

const expect = require('must-dist');
const moment = require('moment-timezone');
const R = require('ramda');

const beans = require('../../testutil/configureForTest').get('beans');
const events = beans.get('events');
const e = beans.get('eventConstants');
const RegistrationReadModel = beans.get('RegistrationReadModel');

const sessionId1 = 'session-id-1';
const sessionId2 = 'session-id-2';

const singleBedRoom = 'single';
const bedInDouble = 'bed_in_double';

const untilSaturday = 'untilSaturday';
const untilSundayMorning = 'untilSundayMorning';

const memberId1 = 'member-id-1';
const memberId2 = 'member-id-2';

const aLongTimeAgo = moment.tz().subtract(40, 'minutes');
const aShortTimeAgo = moment.tz().subtract(10, 'minutes');
const anEvenShorterTimeAgo = moment.tz().subtract(1, 'minutes');

function stripTimestamps(someEvents) {
  return someEvents.map(event => {
    const newEvent = R.clone(event);
    delete newEvent.timestamp;
    return newEvent;
  });
}

describe('The registration read model', () => {

  let listOfEvents;

  beforeEach(() => {
    listOfEvents = [];
  });

  describe('considering removals (participantsByMemberIdFor)', () => {

    it('does not return the member id  and information of a participant that has been removed', () => {
      listOfEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aShortTimeAgo),
        events.participantWasRemoved(singleBedRoom, memberId1)];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(readModel.allParticipantsIn(singleBedRoom)).to.eql([]);
    });
  });

  describe('for waitinglist reservations and participants (waitinglistReservationsAndParticipantsFor)', () => {
    it('does not consider any waitinglist participants when there are no events', () => {
      const readModel = new RegistrationReadModel(listOfEvents);
      expect(readModel.waitinglistParticipantValuesFor(singleBedRoom)).to.eql([]);
    });

    it('considers participations', () => {
      listOfEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId1, memberId1, aLongTimeAgo),
        events.waitinglistParticipantWasRegistered([singleBedRoom], 3, sessionId2, memberId2, aShortTimeAgo)];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(stripTimestamps(readModel.waitinglistParticipantValuesFor(singleBedRoom))).to.eql([
        {
          event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
          sessionId: sessionId1,
          memberId: memberId1,
          desiredRoomTypes: [singleBedRoom],
          duration: 2,
          joinedWaitinglist: aLongTimeAgo.valueOf()
        },
        {
          event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
          sessionId: sessionId2,
          memberId: memberId2,
          desiredRoomTypes: [singleBedRoom],
          duration: 3,
          joinedWaitinglist: aShortTimeAgo.valueOf()
        }]);
    });

    it('does not consider registrations that have a matching participation', () => {
      // ??? what is that?
      listOfEvents = [
        events.waitinglistReservationWasIssued([singleBedRoom], 2, sessionId1, memberId1, aShortTimeAgo),
        events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId1, memberId1, anEvenShorterTimeAgo)];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(stripTimestamps(readModel.waitinglistParticipantValuesFor(singleBedRoom))).to.eql([
        {
          event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
          sessionId: sessionId1,
          memberId: memberId1,
          desiredRoomTypes: [singleBedRoom],
          duration: 2,
          joinedWaitinglist: anEvenShorterTimeAgo.valueOf()
        }]);
    });

    it('does not consider DID_NOT_... reservation and registration events', () => {
      listOfEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId1, memberId1, aShortTimeAgo),
        events.didNotIssueWaitinglistReservationForAlreadyReservedSession([bedInDouble], sessionId1, memberId1),
        events.didNotRegisterWaitinglistParticipantASecondTime([singleBedRoom], sessionId1, memberId1),
        events.didNotRegisterWaitinglistParticipantWithExpiredOrMissingReservation([singleBedRoom], sessionId1, memberId1)
      ];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(stripTimestamps(readModel.waitinglistParticipantValuesFor(singleBedRoom))).to.eql([
        {
          event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
          sessionId: sessionId1,
          memberId: memberId1,
          desiredRoomTypes: [singleBedRoom],
          duration: 2,
          joinedWaitinglist: aShortTimeAgo.valueOf()
        }]);
      expect(readModel.waitinglistParticipantValuesFor(bedInDouble)).to.eql([]);
    });

    it('returns only the events belonging to the queried room type', () => {
      listOfEvents = [
        events.waitinglistReservationWasIssued([bedInDouble], 2, sessionId1, memberId1, aLongTimeAgo),
        events.waitinglistReservationWasIssued([singleBedRoom], 2, sessionId1, memberId1, aShortTimeAgo),
        events.waitinglistParticipantWasRegistered([bedInDouble], 2, sessionId2, memberId2, aShortTimeAgo),
        events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId1, memberId1, anEvenShorterTimeAgo)];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(stripTimestamps(readModel.waitinglistParticipantValuesFor(singleBedRoom))).to.eql([
        {
          event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
          sessionId: sessionId1,
          memberId: memberId1,
          desiredRoomTypes: [singleBedRoom],
          duration: 2,
          joinedWaitinglist: anEvenShorterTimeAgo.valueOf()
        }]);
      expect(stripTimestamps(readModel.waitinglistParticipantValuesFor(bedInDouble))).to.eql([
        {
          event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
          sessionId: sessionId2,
          memberId: memberId2,
          desiredRoomTypes: [bedInDouble],
          duration: 2,
          joinedWaitinglist: aShortTimeAgo.valueOf()
        }]);
    });
  });

  describe('knows about registered persons (isAlreadyRegistered)', () => {
    it('registers a registrationTuple', () => {
      listOfEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aShortTimeAgo)];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(readModel.isAlreadyRegistered(memberId1)).to.be.true();
    });

  });

  describe('knows about a participant\'s selected options (selectedOptionsFor)', () => {

    it('returns the options for a participant', () => {
      listOfEvents = [
        events.registeredParticipantFromWaitinglist('single', 3, memberId1, aShortTimeAgo)];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(readModel.selectedOptionsFor(memberId1)).to.be('single,3');
    });

    it('returns the options for a waitinglist participant', () => {
      listOfEvents = [
        events.waitinglistParticipantWasRegistered(['single', 'junior'], 2, sessionId1, memberId1, aShortTimeAgo)];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(readModel.selectedOptionsFor(memberId1)).to.eql('single,waitinglist,2;junior,waitinglist,2');
    });

    it('returns the options for somebody who is participant and waitinglist participant', () => {
      listOfEvents = [
        events.registeredParticipantFromWaitinglist('bed_in_double', 3, memberId1, aShortTimeAgo),
        events.waitinglistParticipantWasRegistered(['single', 'junior'], 2, sessionId1, memberId1, aShortTimeAgo)];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(readModel.selectedOptionsFor(memberId1)).to.eql('bed_in_double,3;single,waitinglist,2;junior,waitinglist,2');
    });

    it('returns an empty string as the options for an unregistered member', () => {
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(readModel.selectedOptionsFor(memberId1)).to.be('');
    });

  });

  describe('knows about participants on waitinglist (isAlreadyOnWaitinglist)', () => {
    it('returns false if participant is not on waitinglist', () => {
      listOfEvents = [];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(readModel.isAlreadyOnWaitinglist(memberId1)).to.eql(false);
    });

    it('returns true if participant is on waitinglist', () => {
      listOfEvents = [
        events.waitinglistParticipantWasRegistered(['single', 'junior'], 2, sessionId1, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(readModel.isAlreadyOnWaitinglist(memberId1)).to.eql(true);
    });

  });

  describe('knows in what room type the participant is registered (registeredInRoomType)', () => {
    it('returns the right room type for a registered participant', () => {
      listOfEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(listOfEvents);
      expect(readModel.registeredInRoomType(memberId1)).to.eql(singleBedRoom);
    });

    it('returns null if member is not registered', () => {
      listOfEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(listOfEvents);
      expect(readModel.registeredInRoomType(memberId2)).to.eql(null);
    });

    it('returns the right room if participant has changed the room type', () => {
      listOfEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSundayMorning, memberId1, aLongTimeAgo),
        events.roomTypeWasChanged(memberId1, bedInDouble, untilSaturday, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(readModel.registeredInRoomType(memberId1)).to.eql(bedInDouble);
    });

    it('returns the right room if participant was moved from waitinglist', () => {
      listOfEvents = [
        events.waitinglistParticipantWasRegistered([bedInDouble, singleBedRoom], 2, sessionId1, memberId1, aLongTimeAgo),
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(readModel.registeredInRoomType(memberId1)).to.eql(singleBedRoom);
    });
  });

  describe('knows the room types of a participant or waitinglist participant (roomTypesOf)', () => {

    it('returns the correct room type for a registered participant', () => {
      listOfEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSundayMorning, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(listOfEvents);
      expect(readModel.roomTypesOf(memberId1)).to.eql([singleBedRoom]);
    });

    it('returns the desired room types of a waitinglist participant', () => {
      listOfEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom, bedInDouble], 2, sessionId1, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(readModel.roomTypesOf(memberId1)).to.eql([singleBedRoom, bedInDouble]);
    });

    it('returns the right room types if they were changed', () => {
      listOfEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo),
        events.waitinglistParticipantWasRegistered([bedInDouble], 2, sessionId2, memberId2, aLongTimeAgo),
        events.desiredRoomTypesWereChanged(memberId2, [singleBedRoom], aLongTimeAgo),
        events.roomTypeWasChanged(memberId1, bedInDouble, untilSundayMorning, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(readModel.roomTypesOf(memberId1)).to.eql([bedInDouble]);
      expect(readModel.roomTypesOf(memberId2)).to.eql([singleBedRoom]);

    });

    it('returns the right room types when participant/waitinglist participant was removed', () => {
      listOfEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSundayMorning, memberId1, aLongTimeAgo),
        events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId2, memberId2, aLongTimeAgo),
        events.participantWasRemoved(singleBedRoom, memberId1),
        events.waitinglistParticipantWasRemoved([singleBedRoom], memberId2)
      ];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(readModel.roomTypesOf(memberId1)).to.eql([]);
      expect(readModel.roomTypesOf(memberId2)).to.eql([]);
    });

    it('returns the registered room type even when participant is also on waitinglist', () => {
      listOfEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSundayMorning, memberId1, aLongTimeAgo),
        events.waitinglistParticipantWasRegistered([bedInDouble], 2, sessionId1, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(readModel.roomTypesOf(memberId1)).to.eql([singleBedRoom]);
    });
  });

  describe('Registrations for participants and waitinglist participants', () => {

    it('for a registered participant', () => {
      listOfEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, 2, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(readModel.allParticipantsIn(singleBedRoom)).to.eql([memberId1]);
      expect(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom)).to.eql({});
    });
  });

  describe('knows when a participant entered the system (joinedSoCraTesAt)', () => {
    it('when he is registered', () => {
      listOfEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(readModel.joinedSoCraTesAt(memberId1)).to.eql(aLongTimeAgo);
    });

    it('when he is registered from waitinglist', () => {
      listOfEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(readModel.joinedSoCraTesAt(memberId1)).to.eql(aLongTimeAgo);
    });

    it('when his room type was changed', () => {
      listOfEvents = [
        events.roomTypeWasChanged(memberId1, singleBedRoom, untilSaturday, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(readModel.joinedSoCraTesAt(memberId1)).to.eql(aLongTimeAgo);
    });

    it('when his duration was changed', () => {
      listOfEvents = [
        events.durationWasChanged(memberId1, singleBedRoom, untilSaturday, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(readModel.joinedSoCraTesAt(memberId1)).to.eql(aLongTimeAgo);
    });
  });

  describe('knows when a waitinglist participant entered the system (joinedWaitinglistAt)', () => {
    it('when he is registered', () => {
      listOfEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId1, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(readModel.joinedWaitinglistAt(memberId1)).to.eql(aLongTimeAgo);
    });

    it('when his desired room types are changed', () => {
      listOfEvents = [
        events.desiredRoomTypesWereChanged(memberId1, [singleBedRoom], aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(listOfEvents);

      expect(readModel.joinedWaitinglistAt(memberId1)).to.eql(aLongTimeAgo);
    });
  });

  it('for a registered participant without reservation', () => {
    listOfEvents = [
      events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo)
    ];
    const readModel = new RegistrationReadModel(listOfEvents);

    expect(readModel.allParticipantsIn(singleBedRoom)).to.eql([memberId1]);
    expect(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom)).to.eql({});
  });

  it('for a waitinglist reservation', () => {
    listOfEvents = [
      events.waitinglistReservationWasIssued(singleBedRoom, 2, sessionId1, memberId1, aLongTimeAgo),
      events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo)
    ];
    const readModel = new RegistrationReadModel(listOfEvents);

    expect(readModel.allParticipantsIn(singleBedRoom)).to.eql([memberId1]);
    expect(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom)).to.eql({});
  });

  it('for a waitinglist participant to a participant', () => {
    listOfEvents = [
      events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId1, memberId1, aLongTimeAgo),
      events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo)
    ];
    const readModel = new RegistrationReadModel(listOfEvents);

    expect(readModel.allParticipantsIn(singleBedRoom)).to.eql([memberId1]);
    expect(R.keys(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom))).to.eql([]);
  });

  it('for a waitinglist participant registering with reservation', () => {
    listOfEvents = [
      events.waitinglistReservationWasIssued([singleBedRoom], 2, sessionId1, memberId1, aLongTimeAgo),
      events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId1, memberId1, aLongTimeAgo)
    ];
    const readModel = new RegistrationReadModel(listOfEvents);

    expect(readModel.allParticipantsIn(singleBedRoom)).to.eql([]);
    expect(R.keys(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom))).to.eql([memberId1]);
  });

  it('for a waitinglist participant registering without reservation', () => {
    listOfEvents = [
      events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId1, memberId1, aLongTimeAgo)
    ];
    const readModel = new RegistrationReadModel(listOfEvents);
    expect(readModel.allParticipantsIn(singleBedRoom)).to.eql([]);
    expect(R.keys(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom))).to.eql([memberId1]);
  });

  it('for a registered participant', () => {
    listOfEvents = [
      events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aShortTimeAgo)
    ];
    const readModel = new RegistrationReadModel(listOfEvents);

    expect(readModel.allParticipantsIn(singleBedRoom)).to.eql([memberId1]);
    expect(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom)).to.eql({});
  });

});
