'use strict';

const expect = require('must-dist');
const moment = require('moment-timezone');
const R = require('ramda');

const beans = require('../../testutil/configureForTest').get('beans');
const events = beans.get('events');
const e = beans.get('eventConstants');
const GlobalEventStore = beans.get('GlobalEventStore');
const RegistrationReadModel = beans.get('RegistrationReadModel');
const SoCraTesReadModel = beans.get('SoCraTesReadModel');

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

  let eventStore;

  beforeEach(() => {
    eventStore = new GlobalEventStore();
  });

  describe('calculating the reservation expiration time (reservationExpiration)', () => {

    it('returns undefined as the expiration time if there are no waitinglist reservations for the given session id', () => {
      eventStore.state.events = [
        events.waitinglistReservationWasIssued(singleBedRoom, 2, sessionId1, memberId1, aShortTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.reservationExpiration(sessionId2)).to.be(undefined);
    });

    it('returns undefined as the expiration time of the waitinglist reservation if it is already expired', () => {
      eventStore.state.events = [
        events.waitinglistReservationWasIssued(singleBedRoom, 2, sessionId1, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.reservationExpiration(sessionId1)).to.be(undefined);
    });

    it('returns the expiration time of the waitinglist reservation if there is one', () => {
      eventStore.state.events = [
        events.waitinglistReservationWasIssued(singleBedRoom, 2, sessionId1, memberId1, aShortTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.reservationExpiration(sessionId1).valueOf()).to.be(aShortTimeAgo.add(30, 'minutes').valueOf());
    });
  });

  describe('giving the reservations and participants for a room type (reservationsAndParticipantsFor)', () => {

    it('does not consider any reservations or participants when there are no events', () => {
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.reservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
    });

    it('considers participations', () => {
      eventStore.state.events = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo),
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSundayMorning, memberId2, aShortTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(stripTimestamps(readModel.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
        {
          event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST,
          memberId: memberId1,
          roomType: singleBedRoom,
          duration: untilSaturday,
          joinedSoCraTes: aLongTimeAgo.valueOf()
        },
        {
          event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST,
          memberId: memberId2,
          roomType: singleBedRoom,
          duration: untilSundayMorning,
          joinedSoCraTes: aShortTimeAgo.valueOf()
        }]);
    });

    it('returns only the events belonging to the queried room type', () => {
      eventStore.state.events = [
        events.registeredParticipantFromWaitinglist(bedInDouble, untilSaturday, memberId2, aShortTimeAgo),
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSundayMorning, memberId1, anEvenShorterTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(stripTimestamps(readModel.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
        {
          event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST,
          memberId: memberId1,
          roomType: singleBedRoom,
          duration: untilSundayMorning,
          joinedSoCraTes: anEvenShorterTimeAgo.valueOf()
        }]);
      expect(stripTimestamps(readModel.reservationsAndParticipantsFor(bedInDouble))).to.eql([
        {
          event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST,
          memberId: memberId2,
          roomType: bedInDouble,
          duration: untilSaturday,
          joinedSoCraTes: aShortTimeAgo.valueOf()
        }]);
    });

    it('does not list the registration event of a participant that has been removed', () => {
      eventStore.state.events = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aShortTimeAgo),
        events.participantWasRemoved(singleBedRoom, memberId1)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.reservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
    });

  });

  describe('considering removals (participantsByMemberIdFor)', () => {

    it('does not return the member id  and information of a participant that has been removed', () => {
      eventStore.state.events = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aShortTimeAgo),
        events.participantWasRemoved(singleBedRoom, memberId1)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.participantsByMemberIdFor(singleBedRoom)).to.eql({});
    });
  });

  describe('calculating the existence of a valid reservation (hasValidReservationFor)', () => {

    it('returns true if there is a waitinglist reservation', () => {
      eventStore.state.events = [
        events.waitinglistReservationWasIssued(singleBedRoom, 2, sessionId1, memberId1, aShortTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.hasValidReservationFor(sessionId1)).to.be(true);
    });
  });

  describe('for waitinglist reservations and participants (waitinglistReservationsAndParticipantsFor)', () => {
    it('does not consider any waitinglist reservations or participants when there are no events', () => {
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
      expect(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
    });

    it('does not consider reservations that are already expired', () => {
      eventStore.state.events = [
        events.waitinglistReservationWasIssued(singleBedRoom, 2, sessionId1, memberId1, aLongTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
    });

    it('considers reservations that are still active', () => {
      eventStore.state.events = [
        events.waitinglistReservationWasIssued([singleBedRoom], 2, sessionId1, memberId1, aShortTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(stripTimestamps(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom))).to.eql([
        {
          event: e.WAITINGLIST_RESERVATION_WAS_ISSUED,
          sessionId: sessionId1,
          memberId: memberId1,
          desiredRoomTypes: [singleBedRoom],
          duration: 2,
          joinedWaitinglist: aShortTimeAgo.valueOf()
        }]);
    });

    it('considers participations', () => {
      eventStore.state.events = [
        events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId1, memberId1, aLongTimeAgo),
        events.waitinglistParticipantWasRegistered([singleBedRoom], 3, sessionId2, memberId2, aShortTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(stripTimestamps(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom))).to.eql([
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
      eventStore.state.events = [
        events.waitinglistReservationWasIssued([singleBedRoom], 2, sessionId1, memberId1, aShortTimeAgo),
        events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId1, memberId1, anEvenShorterTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(stripTimestamps(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom))).to.eql([
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
      eventStore.state.events = [
        events.waitinglistReservationWasIssued([singleBedRoom], 2, sessionId1, memberId1, aShortTimeAgo),
        events.didNotIssueWaitinglistReservationForAlreadyReservedSession([bedInDouble], sessionId1, memberId1),
        events.didNotRegisterWaitinglistParticipantASecondTime([singleBedRoom], sessionId1, memberId1),
        events.didNotRegisterWaitinglistParticipantWithExpiredOrMissingReservation([singleBedRoom], sessionId1, memberId1)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(stripTimestamps(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom))).to.eql([
        {
          event: e.WAITINGLIST_RESERVATION_WAS_ISSUED,
          sessionId: sessionId1,
          memberId: memberId1,
          desiredRoomTypes: [singleBedRoom],
          duration: 2,
          joinedWaitinglist: aShortTimeAgo.valueOf()
        }]);
      expect(readModel.waitinglistReservationsAndParticipantsFor(bedInDouble)).to.eql([]);
    });

    it('returns only the events belonging to the queried room type', () => {
      eventStore.state.events = [
        events.waitinglistReservationWasIssued([bedInDouble], 2, sessionId1, memberId1, aLongTimeAgo),
        events.waitinglistReservationWasIssued([singleBedRoom], 2, sessionId1, memberId1, aShortTimeAgo),
        events.waitinglistParticipantWasRegistered([bedInDouble], 2, sessionId2, memberId2, aShortTimeAgo),
        events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId1, memberId1, anEvenShorterTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(stripTimestamps(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom))).to.eql([
        {
          event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
          sessionId: sessionId1,
          memberId: memberId1,
          desiredRoomTypes: [singleBedRoom],
          duration: 2,
          joinedWaitinglist: anEvenShorterTimeAgo.valueOf()
        }]);
      expect(stripTimestamps(readModel.waitinglistReservationsAndParticipantsFor(bedInDouble))).to.eql([
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
      eventStore.state.events = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aShortTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.isAlreadyRegistered(memberId1)).to.be.true();
    });

  });

  describe('knows about a participant\'s selected options (selectedOptionsFor)', () => {

    it('returns the options for a participant', () => {
      eventStore.state.events = [
        events.registeredParticipantFromWaitinglist('single', 3, memberId1, aShortTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.selectedOptionsFor(memberId1)).to.be('single,3');
    });

    it('returns the options for a waitinglist participant', () => {
      eventStore.state.events = [
        events.waitinglistParticipantWasRegistered(['single', 'junior'], 2, sessionId1, memberId1, aShortTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.selectedOptionsFor(memberId1)).to.eql('single,waitinglist,2;junior,waitinglist,2');
    });

    it('returns the options for somebody who is participant and waitinglist participant', () => {
      eventStore.state.events = [
        events.registeredParticipantFromWaitinglist('bed_in_double', 3, memberId1, aShortTimeAgo),
        events.waitinglistParticipantWasRegistered(['single', 'junior'], 2, sessionId1, memberId1, aShortTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.selectedOptionsFor(memberId1)).to.eql('bed_in_double,3;single,waitinglist,2;junior,waitinglist,2');
    });

    it('returns an empty string as the options for an unregistered member', () => {
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.selectedOptionsFor(memberId1)).to.be('');
    });

  });

  describe('knows about participants on waitinglist (isAlreadyOnWaitinglist)', () => {
    it('returns false if participant is not on waitinglist', () => {
      eventStore.state.events = [];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.isAlreadyOnWaitinglist(memberId1)).to.eql(false);
    });

    it('returns true if participant is on waitinglist', () => {
      eventStore.state.events = [
        events.waitinglistParticipantWasRegistered(['single', 'junior'], 2, sessionId1, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.isAlreadyOnWaitinglist(memberId1)).to.eql(true);
    });

  });

  describe('knows if rooms are full (isFull)', () => {
    it('returns true when the room is full', () => {
      eventStore.state.events = [
        events.roomQuotaWasSet(singleBedRoom, 1),
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.isFull(singleBedRoom)).to.eql(true);
    });
    it('returns false if the room quota was not set', () => {
      eventStore.state.events = [events.roomQuotaWasSet(bedInDouble, 100)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.isFull(singleBedRoom)).to.eql(false);
    });

    it('is no longer full when participant was removed from full room', () => {
      eventStore.state.events = [
        events.roomQuotaWasSet(singleBedRoom, 1),
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo),
        events.participantWasRemoved(singleBedRoom, memberId1)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.isFull(singleBedRoom)).to.eql(false);
    });

    it('returns true if participant was registered from waitinglist', () => {
      eventStore.state.events = [
        events.roomQuotaWasSet(singleBedRoom, 1),
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.isFull(singleBedRoom)).to.eql(true);
    });

    it('returns true when person is moved by changing his room type', () => {
      eventStore.state.events = [
        events.roomQuotaWasSet(singleBedRoom, 1),
        events.roomQuotaWasSet(bedInDouble, 1),
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo),
        events.roomTypeWasChanged(memberId1, bedInDouble, untilSaturday, aLongTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.isFull(singleBedRoom)).to.eql(false);
      expect(readModel.isFull(bedInDouble)).to.eql(true);
    });
  });

  describe('knows in what room type the participant is registered (registeredInRoomType)', () => {
    it('returns the right room type for a registered participant', () => {
      eventStore.state.events = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
      expect(readModel.registeredInRoomType(memberId1)).to.eql(singleBedRoom);
    });

    it('returns null if member is not registered', () => {
      eventStore.state.events = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
      expect(readModel.registeredInRoomType(memberId2)).to.eql(null);
    });

    it('returns the right room if participant has changed the room type', () => {
      eventStore.state.events = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSundayMorning, memberId1, aLongTimeAgo),
        events.roomTypeWasChanged(memberId1, bedInDouble, untilSaturday, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.registeredInRoomType(memberId1)).to.eql(bedInDouble);
    });

    it('returns the right room if participant was moved from waitinglist', () => {
      eventStore.state.events = [
        events.waitinglistParticipantWasRegistered([bedInDouble, singleBedRoom], 2, sessionId1, memberId1, aLongTimeAgo),
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.registeredInRoomType(memberId1)).to.eql(singleBedRoom);
    });
  });

  describe('knows the room types of a participant or waitinglist participant (roomTypesOf)', () => {

    it('returns the correct room type for a registered participant', () => {
      eventStore.state.events = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSundayMorning, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
      expect(readModel.roomTypesOf(memberId1)).to.eql([singleBedRoom]);
    });

    it('returns the desired room types of a waitinglist participant', () => {
      eventStore.state.events = [
        events.waitinglistParticipantWasRegistered([singleBedRoom, bedInDouble], 2, sessionId1, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.roomTypesOf(memberId1)).to.eql([singleBedRoom, bedInDouble]);
    });

    it('returns the right room types if they were changed', () => {
      eventStore.state.events = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo),
        events.waitinglistParticipantWasRegistered([bedInDouble], 2, sessionId2, memberId2, aLongTimeAgo),
        events.desiredRoomTypesWereChanged(memberId2, [singleBedRoom], aLongTimeAgo),
        events.roomTypeWasChanged(memberId1, bedInDouble, untilSundayMorning, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.roomTypesOf(memberId1)).to.eql([bedInDouble]);
      expect(readModel.roomTypesOf(memberId2)).to.eql([singleBedRoom]);

    });

    it('returns the right room types when participant/waitinglist participant was removed', () => {
      eventStore.state.events = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSundayMorning, memberId1, aLongTimeAgo),
        events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId2, memberId2, aLongTimeAgo),
        events.participantWasRemoved(singleBedRoom, memberId1),
        events.waitinglistParticipantWasRemoved([singleBedRoom], memberId2)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.roomTypesOf(memberId1)).to.eql([]);
      expect(readModel.roomTypesOf(memberId2)).to.eql([]);
    });

    it('returns the registered room type even when participant is also on waitinglist', () => {
      eventStore.state.events = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSundayMorning, memberId1, aLongTimeAgo),
        events.waitinglistParticipantWasRegistered([bedInDouble], 2, sessionId1, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.roomTypesOf(memberId1)).to.eql([singleBedRoom]);
    });
  });

  describe('Registrations for participants and waitinglist participants', () => {

    it('for a registered participant', () => {
      eventStore.state.events = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, 2, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(R.keys(readModel.participantsByMemberIdFor(singleBedRoom))).to.eql([memberId1]);
      expect(readModel.waitinglistReservationsBySessionIdFor(singleBedRoom)).to.eql({});
      expect(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom)).to.eql({});
    });
  });

  describe('knows when a participant entered the system (joinedSoCraTesAt)', () => {
    it('when he is registered', () => {
      eventStore.state.events = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.joinedSoCraTesAt(memberId1)).to.eql(aLongTimeAgo);
    });

    it('when he is registered from waitinglist', () => {
      eventStore.state.events = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.joinedSoCraTesAt(memberId1)).to.eql(aLongTimeAgo);
    });

    it('when his room type was changed', () => {
      eventStore.state.events = [
        events.roomTypeWasChanged(memberId1, singleBedRoom, untilSaturday, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.joinedSoCraTesAt(memberId1)).to.eql(aLongTimeAgo);
    });

    it('when his duration was changed', () => {
      eventStore.state.events = [
        events.durationWasChanged(memberId1, singleBedRoom, untilSaturday, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.joinedSoCraTesAt(memberId1)).to.eql(aLongTimeAgo);
    });
  });

  describe('knows when a waitinglist participant entered the system (joinedWaitinglistAt)', () => {
    it('when he is registered', () => {
      eventStore.state.events = [
        events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId1, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.joinedWaitinglistAt(memberId1)).to.eql(aLongTimeAgo);
    });

    it('when his desired room types are changed', () => {
      eventStore.state.events = [
        events.desiredRoomTypesWereChanged(memberId1, [singleBedRoom], aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.joinedWaitinglistAt(memberId1)).to.eql(aLongTimeAgo);
    });
  });

  it('for a registered participant without reservation', () => {
    eventStore.state.events = [
      events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo)
    ];
    const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

    expect(R.keys(readModel.participantsByMemberIdFor(singleBedRoom))).to.eql([memberId1]);
    expect(readModel.waitinglistReservationsBySessionIdFor(singleBedRoom)).to.eql({});
    expect(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom)).to.eql({});
  });

  it('for a waitinglist reservation', () => {
    eventStore.state.events = [
      events.waitinglistReservationWasIssued(singleBedRoom, 2, sessionId1, memberId1, aLongTimeAgo),
      events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo)
    ];
    const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

    expect(R.keys(readModel.participantsByMemberIdFor(singleBedRoom))).to.eql([memberId1]);
    expect(readModel.waitinglistReservationsBySessionIdFor(singleBedRoom)).to.eql({});
    expect(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom)).to.eql({});
  });

  it('for a waitinglist participant to a participant', () => {
    eventStore.state.events = [
      events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId1, memberId1, aLongTimeAgo),
      events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo)
    ];
    const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

    expect(R.keys(readModel.participantsByMemberIdFor(singleBedRoom))).to.eql([memberId1]);
    expect(readModel.waitinglistReservationsBySessionIdFor(singleBedRoom)).to.eql({});
    expect(R.keys(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom))).to.eql([]);
  });

  it('for a waitinglist participant registering with reservation', () => {
    eventStore.state.events = [
      events.waitinglistReservationWasIssued([singleBedRoom], 2, sessionId1, memberId1, aLongTimeAgo),
      events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId1, memberId1, aLongTimeAgo)
    ];
    const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

    expect(readModel.participantsByMemberIdFor(singleBedRoom)).to.eql({});
    expect(readModel.waitinglistReservationsBySessionIdFor(singleBedRoom)).to.eql({});
    expect(R.keys(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom))).to.eql([memberId1]);
  });

  it('for a waitinglist participant registering without reservation', () => {
    eventStore.state.events = [
      events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId1, memberId1, aLongTimeAgo)
    ];
    const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
    expect(readModel.participantsByMemberIdFor(singleBedRoom)).to.eql({});
    expect(readModel.waitinglistReservationsBySessionIdFor(singleBedRoom)).to.eql({});
    expect(R.keys(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom))).to.eql([memberId1]);
  });

  it('for a registered participant', () => {
    eventStore.state.events = [
      events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aShortTimeAgo)
    ];
    const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

    expect(R.keys(readModel.participantsByMemberIdFor(singleBedRoom))).to.eql([memberId1]);
    expect(readModel.waitinglistReservationsBySessionIdFor(singleBedRoom)).to.eql({});
    expect(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom)).to.eql({});
  });

});
