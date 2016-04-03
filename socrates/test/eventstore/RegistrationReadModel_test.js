'use strict';

var expect = require('must-dist');
var moment = require('moment-timezone');
var R = require('ramda');

var beans = require('../../testutil/configureForTest').get('beans');
var events = beans.get('events');
var e = beans.get('eventConstants');
var GlobalEventStore = beans.get('GlobalEventStore');
var RegistrationReadModel = beans.get('RegistrationReadModel');

var sessionId1 = 'session-id-1';
var sessionId2 = 'session-id-2';

var singleBedRoom = 'singleBedRoom';
var bedInDouble = 'bedInDouble';

var untilSaturday = 'untilSaturday';
var untilSundayMorning = 'untilSundayMorning';

var memberId1 = 'member-id-1';
var memberId2 = 'member-id-2';

var aLongTimeAgo = moment.tz().subtract(40, 'minutes');
var aShortTimeAgo = moment.tz().subtract(10, 'minutes');
var anEvenShorterTimeAgo = moment.tz().subtract(1, 'minutes');

function setTimestamp(event, timestamp) {
  event.timestamp = timestamp.valueOf();
  return event;
}

describe('The registration read model', function () {

  var eventStore;
  var readModel;

  beforeEach(function () {
    eventStore = new GlobalEventStore();
    readModel = new RegistrationReadModel(eventStore);
  });

  describe('calculating the reservation expiration time (reservationExpiration)', function () {

    it('returns undefined as the expiration time if there are no reservations for the given session id', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aShortTimeAgo)
      ];

      expect(readModel.reservationExpiration(sessionId2)).to.be(undefined);
    });

    it('returns the expiration time of the reservation if there is one', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aShortTimeAgo)
      ];

      expect(readModel.reservationExpiration(sessionId1).valueOf()).to.be(aShortTimeAgo.add(30, 'minutes').valueOf());
    });

    it('returns undefined as the expiration time of the reservation if it is already expired', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aLongTimeAgo)
      ];

      expect(readModel.reservationExpiration(sessionId1)).to.be(undefined);
    });

    it('returns the expiration time of the waitinglist reservation if there is no regular reservation', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.waitinglistReservationWasIssued(singleBedRoom, sessionId1), aShortTimeAgo)
      ];

      expect(readModel.reservationExpiration(sessionId1).valueOf()).to.be(aShortTimeAgo.add(30, 'minutes').valueOf());
    });

    it('returns the expiration time of the reservation if there are both regular and waitinglist reservations', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aShortTimeAgo),
        setTimestamp(events.waitinglistReservationWasIssued(singleBedRoom, sessionId1), anEvenShorterTimeAgo)
      ];

      expect(readModel.reservationExpiration(sessionId1).valueOf()).to.be(aShortTimeAgo.add(30, 'minutes').valueOf());

    });
  });

  describe('giving the reservations and participants for a room type (reservationsAndParticipantsFor)', function () {

    it('does not consider any reservations or participants when there are no events', function () {

      expect(readModel.reservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
    });

    it('does not consider reservations that are already expired', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1), aLongTimeAgo)];

      expect(readModel.reservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
    });

    it('considers reservations that are still active', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1), aShortTimeAgo)];

      expect(readModel.reservationsAndParticipantsFor(singleBedRoom)).to.eql([
        {
          event: e.RESERVATION_WAS_ISSUED,
          sessionID: sessionId1,
          roomType: singleBedRoom,
          duration: untilSaturday,
          timestamp: aShortTimeAgo.valueOf()
        }]);
    });

    it('considers participations', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1), aLongTimeAgo),
        setTimestamp(events.participantWasRegistered(singleBedRoom, untilSundayMorning, sessionId2, memberId2), aShortTimeAgo)];

      expect(readModel.reservationsAndParticipantsFor(singleBedRoom)).to.eql([
        {
          event: e.PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId1,
          memberId: memberId1,
          roomType: singleBedRoom,
          duration: untilSaturday,
          timestamp: aLongTimeAgo.valueOf()
        },
        {
          event: e.PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId2,
          memberId: memberId2,
          roomType: singleBedRoom,
          duration: untilSundayMorning,
          timestamp: aShortTimeAgo.valueOf()
        }]);
    });

    it('does not consider registrations that have a matching participation', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1), aShortTimeAgo),
        setTimestamp(events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1), anEvenShorterTimeAgo)];

      expect(readModel.reservationsAndParticipantsFor(singleBedRoom)).to.eql([
        {
          event: e.PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId1,
          memberId: memberId1,
          roomType: singleBedRoom,
          duration: untilSaturday,
          timestamp: anEvenShorterTimeAgo.valueOf()
        }]);
    });

    it('does not consider DID_NOT_... reservation and registration events', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1), aShortTimeAgo),
        setTimestamp(events.didNotIssueReservationForAlreadyReservedSession(bedInDouble, untilSaturday, sessionId1), aShortTimeAgo),
        setTimestamp(events.didNotIssueReservationForFullResource(singleBedRoom, untilSaturday, sessionId2), aShortTimeAgo),
        setTimestamp(events.didNotRegisterParticipantForFullResource(singleBedRoom, untilSundayMorning, sessionId1, memberId1), aShortTimeAgo),
        setTimestamp(events.didNotRegisterParticipantASecondTime(singleBedRoom, untilSundayMorning, sessionId1, memberId1), aShortTimeAgo)
      ];

      expect(readModel.reservationsAndParticipantsFor(singleBedRoom)).to.eql([
        {
          event: e.RESERVATION_WAS_ISSUED,
          sessionID: sessionId1,
          roomType: singleBedRoom,
          duration: untilSaturday,
          timestamp: aShortTimeAgo.valueOf()
        }]);
      expect(readModel.reservationsAndParticipantsFor(bedInDouble)).to.eql([]);
    });

    it('returns only the events belonging to the queried room type', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(bedInDouble, untilSaturday, sessionId1), aLongTimeAgo),
        setTimestamp(events.reservationWasIssued(singleBedRoom, untilSundayMorning, sessionId1), aShortTimeAgo),
        setTimestamp(events.participantWasRegistered(bedInDouble, untilSaturday, sessionId2, memberId2), aShortTimeAgo),
        setTimestamp(events.participantWasRegistered(singleBedRoom, untilSundayMorning, sessionId1, memberId1), anEvenShorterTimeAgo)];

      expect(readModel.reservationsAndParticipantsFor(singleBedRoom)).to.eql([
        {
          event: e.PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId1,
          memberId: memberId1,
          roomType: singleBedRoom,
          duration: untilSundayMorning,
          timestamp: anEvenShorterTimeAgo.valueOf()
        }]);
      expect(readModel.reservationsAndParticipantsFor(bedInDouble)).to.eql([
        {
          event: e.PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId2,
          memberId: memberId2,
          roomType: bedInDouble,
          duration: untilSaturday,
          timestamp: aShortTimeAgo.valueOf()
        }]);
    });
    it('does not list the registration event of a participant that has been removed', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1),
        events.participantWasRemoved(singleBedRoom, memberId1)];

      expect(readModel.reservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
    });

  });

  describe('considering removals (participantsByMemberIdFor)', function () {

    it('does not return the member id  and information of a participant that has been removed', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1),
        events.participantWasRemoved(singleBedRoom, memberId1)];

      expect(readModel.participantsByMemberIdFor(singleBedRoom)).to.eql({});
    });
  });

  describe('calculating the existence of a valid reservation (hasValidReservationFor)', function () {

    it('returns false if there are no reservations for the given session id', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aShortTimeAgo)
      ];

      expect(readModel.hasValidReservationFor(sessionId2)).to.be(false);
    });

    it('returns true if there is a valid reservation', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aShortTimeAgo)
      ];

      expect(readModel.hasValidReservationFor(sessionId1)).to.be(true);
    });

    it('returns false if the reservation is already expired', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aLongTimeAgo)
      ];

      expect(readModel.hasValidReservationFor(sessionId1)).to.be(false);
    });

    it('returns true if there is a waitinglist reservation but no no regular reservation', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.waitinglistReservationWasIssued(singleBedRoom, sessionId1), aShortTimeAgo)
      ];

      expect(readModel.hasValidReservationFor(sessionId1)).to.be(true);
    });

    it('returns true if there are both regular and waitinglist reservations', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aShortTimeAgo),
        setTimestamp(events.waitinglistReservationWasIssued(singleBedRoom, sessionId1), anEvenShorterTimeAgo)
      ];

      expect(readModel.hasValidReservationFor(sessionId1)).to.be(true);
    });
  });

  describe('for waitinglist reservations and participants (waitinglistReservationsAndParticipantsFor)', function () {
    it('does not consider any waitinglist reservations or participants when there are no events', function () {
      expect(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
    });

    it('does not consider reservations that are already expired', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.waitinglistReservationWasIssued(singleBedRoom, sessionId1), aLongTimeAgo)];

      expect(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
    });

    it('considers reservations that are still active', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.waitinglistReservationWasIssued([singleBedRoom], sessionId1), aShortTimeAgo)];

      expect(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([
        {
          event: e.WAITINGLIST_RESERVATION_WAS_ISSUED,
          sessionID: sessionId1,
          desiredRoomTypes: [singleBedRoom],
          timestamp: aShortTimeAgo.valueOf()
        }]);
    });

    it('considers participations', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId1, memberId1), aLongTimeAgo),
        setTimestamp(events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId2, memberId2), aShortTimeAgo)];

      expect(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([
        {
          event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId1,
          memberId: memberId1,
          desiredRoomTypes: [singleBedRoom],
          timestamp: aLongTimeAgo.valueOf()
        },
        {
          event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId2,
          memberId: memberId2,
          desiredRoomTypes: [singleBedRoom],
          timestamp: aShortTimeAgo.valueOf()
        }]);
    });

    it('does not consider registrations that have a matching participation', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.waitinglistReservationWasIssued([singleBedRoom], sessionId1), aShortTimeAgo),
        setTimestamp(events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId1, memberId1), anEvenShorterTimeAgo)];

      expect(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([
        {
          event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId1,
          memberId: memberId1,
          desiredRoomTypes: [singleBedRoom],
          timestamp: anEvenShorterTimeAgo.valueOf()
        }]);
    });

    it('does not consider DID_NOT_... reservation and registration events', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.waitinglistReservationWasIssued([singleBedRoom], sessionId1), aShortTimeAgo),
        setTimestamp(events.didNotIssueWaitinglistReservationForAlreadyReservedSession([bedInDouble], sessionId1), aShortTimeAgo),
        setTimestamp(events.didNotRegisterParticipantASecondTime(singleBedRoom, sessionId1, memberId1), aShortTimeAgo)
      ];

      expect(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([
        {
          event: e.WAITINGLIST_RESERVATION_WAS_ISSUED,
          sessionID: sessionId1,
          desiredRoomTypes: [singleBedRoom],
          timestamp: aShortTimeAgo.valueOf()
        }]);
      expect(readModel.waitinglistReservationsAndParticipantsFor(bedInDouble)).to.eql([]);
    });

    it('returns only the events belonging to the queried room type', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.waitinglistReservationWasIssued([bedInDouble], sessionId1), aLongTimeAgo),
        setTimestamp(events.waitinglistReservationWasIssued([singleBedRoom], sessionId1), aShortTimeAgo),
        setTimestamp(events.waitinglistParticipantWasRegistered([bedInDouble], sessionId2, memberId2), aShortTimeAgo),
        setTimestamp(events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId1, memberId1), anEvenShorterTimeAgo)];

      expect(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([
        {
          event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId1,
          memberId: memberId1,
          desiredRoomTypes: [singleBedRoom],
          timestamp: anEvenShorterTimeAgo.valueOf()
        }]);
      expect(readModel.waitinglistReservationsAndParticipantsFor(bedInDouble)).to.eql([
        {
          event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId2,
          memberId: memberId2,
          desiredRoomTypes: [bedInDouble],
          timestamp: aShortTimeAgo.valueOf()
        }]);
    });
  });

  describe('knows about registered persons (isAlreadyRegistered)', function () {
    it('registers a registrationTuple', function () {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1),
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1)];

      expect(readModel.isAlreadyRegistered(memberId1)).to.be.true();
    });

  });

  describe('knows about a participant\'s selected options (selectedOptionsFor)', function () {

    it('returns a registered member\'s option', function () {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued('single', 3, sessionId1),
        events.participantWasRegistered('single', 3, sessionId1, memberId1)];

      expect(readModel.selectedOptionsFor(memberId1)).to.be('single,3');
    });

    it('returns a registered member\'s options for waitinglist registration', function () {
      eventStore.state.registrationEvents = [
        events.waitinglistReservationWasIssued(['single', 'junior'], sessionId1),
        events.waitinglistParticipantWasRegistered(['single', 'junior'], sessionId1, memberId1)];

      expect(readModel.selectedOptionsFor(memberId1)).to.eql('single,waitinglist;junior,waitinglist');
    });

    it('returns null as the options for a not registered member', function () {

      expect(readModel.selectedOptionsFor(memberId1)).to.be(null);
    });

  });

  describe('knows about participants on waitinglist (isAlreadyOnWaitinglist)', function () {
    it('returns false if participant is not on waitinglist', function () {
      eventStore.state.registrationEvents = [];

      expect(readModel.isAlreadyOnWaitinglist(memberId1)).to.eql(false);
    });

    it('returns true if participant is on waitinglist', function () {
      eventStore.state.registrationEvents = [
        events.waitinglistParticipantWasRegistered(['single', 'junior'], sessionId1, memberId1)
      ];

      expect(readModel.isAlreadyOnWaitinglist(memberId1)).to.eql(true);
    });

  });

  describe('knows if rooms are full (isFull)', function () {
    it('returns true when the room is full', function () {
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 1)];
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1)
      ];

      expect(readModel.isFull(singleBedRoom)).to.eql(true);
    });
    it('returns false if the room quota was not set', function () {
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(bedInDouble, 100)];

      expect(readModel.isFull(singleBedRoom)).to.eql(false);
    });

    it('is no longer full when participant was removed from full room', function () {
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 1)];
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1),
        events.participantWasRemoved(singleBedRoom, memberId1)
      ];

      expect(readModel.isFull(singleBedRoom)).to.eql(false);
    });

    it('returns true if participant was registered from waitinglist', function () {
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 1)];
      eventStore.state.registrationEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1)
      ];

      expect(readModel.isFull(singleBedRoom)).to.eql(true);
    });

    it('returns true when person is moved by changing his room type', function () {
      eventStore.state.socratesEvents = [
        events.roomQuotaWasSet(singleBedRoom, 1),
        events.roomQuotaWasSet(bedInDouble, 1)
      ];
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1),
        events.roomTypeWasChanged(memberId1, bedInDouble, untilSaturday)];

      expect(readModel.isFull(singleBedRoom)).to.eql(false);
      expect(readModel.isFull(bedInDouble)).to.eql(true);
    });
  });

  describe('knows in what room type the participant is registered (registeredInRoomType)', function () {
    it('returns the right room type for a registered participant', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1)
      ];
      expect(readModel.registeredInRoomType(memberId1)).to.eql(singleBedRoom);
    });

    it('returns null if member is not registered', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1)
      ];
      expect(readModel.registeredInRoomType(memberId2)).to.eql(null);
    });

    it('returns the right room if participant has changed the room type', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSundayMorning, sessionId1, memberId1),
        events.roomTypeWasChanged(memberId1, bedInDouble, untilSaturday)
      ];

      expect(readModel.registeredInRoomType(memberId1)).to.eql(bedInDouble);
    });

    it('returns the right room if participant was moved from waitinglist', function () {
      eventStore.state.registrationEvents = [
        events.waitinglistParticipantWasRegistered([bedInDouble, singleBedRoom], sessionId1, memberId1),
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1)
      ];

      expect(readModel.registeredInRoomType(memberId1)).to.eql(singleBedRoom);
    });
  });

  describe('knows the room types of a participant or waitinglist participant (roomTypesOf)', function () {
    it('returns the correct room type for a registered participant', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSundayMorning, sessionId1, memberId1)
      ];
      expect(readModel.roomTypesOf(memberId1)).to.eql([singleBedRoom]);
    });
    it('returns the desired room types of a waitinglist participant', function () {
      eventStore.state.registrationEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom, bedInDouble], sessionId1, memberId1)
      ];

      expect(readModel.roomTypesOf(memberId1)).to.eql([singleBedRoom, bedInDouble]);
    });

    it('returns the right room types if they were changed', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1),
        events.waitinglistParticipantWasRegistered([bedInDouble], sessionId2, memberId2),
        events.desiredRoomTypesWereChanged(memberId2, [singleBedRoom]),
        events.roomTypeWasChanged(memberId1, bedInDouble, untilSundayMorning)
      ];

      expect(readModel.roomTypesOf(memberId1)).to.eql([bedInDouble]);
      expect(readModel.roomTypesOf(memberId2)).to.eql([singleBedRoom]);

    });

    it('returns the right room types when participant/waitinglist participant was removed', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSundayMorning, sessionId1, memberId1),
        events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId2, memberId2),
        events.participantWasRemoved(singleBedRoom, memberId1),
        events.waitinglistParticipantWasRemoved([singleBedRoom], memberId2)
      ];

      expect(readModel.roomTypesOf(memberId1)).to.eql([]);
      expect(readModel.roomTypesOf(memberId2)).to.eql([]);
    });
  });

  describe('Reservations and registrations for participants and waitinglist participants', function () {
    it('for a registered participant', function () {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, 2, sessionId1),
        events.participantWasRegistered(singleBedRoom, 2, sessionId1, memberId1)
      ];

      expect(readModel.reservationsBySessionIdFor(singleBedRoom)).to.eql({});
      expect(R.keys(readModel.participantsByMemberIdFor(singleBedRoom))).to.eql([memberId1]);
      expect(readModel.waitinglistReservationsBySessionIdFor(singleBedRoom)).to.eql({});
      expect(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom)).to.eql({});
    });
  });

  it('for a waitinglist reservation', function () {
    eventStore.state.registrationEvents = [
      events.waitinglistReservationWasIssued(singleBedRoom, sessionId1),
      events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1),
      events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1)
    ];

    expect(readModel.reservationsBySessionIdFor(singleBedRoom)).to.eql({});
    expect(R.keys(readModel.participantsByMemberIdFor(singleBedRoom))).to.eql([memberId1]);
    expect(readModel.waitinglistReservationsBySessionIdFor(singleBedRoom)).to.eql({});
    expect(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom)).to.eql({});
  });

});
