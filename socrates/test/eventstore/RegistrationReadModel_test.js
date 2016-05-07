'use strict';

var expect = require('must-dist');
var moment = require('moment-timezone');
var R = require('ramda');

var beans = require('../../testutil/configureForTest').get('beans');
var events = beans.get('events');
var e = beans.get('eventConstants');
var GlobalEventStore = beans.get('GlobalEventStore');
var RegistrationReadModel = beans.get('RegistrationReadModel');
var SoCraTesReadModel = beans.get('SoCraTesReadModel');

var sessionId1 = 'session-id-1';
var sessionId2 = 'session-id-2';

var singleBedRoom = 'single';
var bedInDouble = 'bed_in_double';

var untilSaturday = 'untilSaturday';
var untilSundayMorning = 'untilSundayMorning';

var memberId1 = 'member-id-1';
var memberId2 = 'member-id-2';

var aLongTimeAgo = moment.tz().subtract(40, 'minutes');
var aShortTimeAgo = moment.tz().subtract(10, 'minutes');
var anEvenShorterTimeAgo = moment.tz().subtract(1, 'minutes');

function stripTimestamps(someEvents) {
  return someEvents.map(function (event) {
    var newEvent = R.clone(event);
    delete newEvent.timestamp;
    return newEvent;
  });
}

describe('The registration read model', function () {

  var eventStore;

  beforeEach(function () {
    eventStore = new GlobalEventStore();
  });

  describe('calculating the reservation expiration time (reservationExpiration)', function () {

    it('returns undefined as the expiration time if there are no reservations for the given session id', function () {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1, memberId1, aShortTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.reservationExpiration(sessionId2)).to.be(undefined);
    });

    it('returns the expiration time of the reservation if there is one', function () {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1, memberId1, aShortTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.reservationExpiration(sessionId1).valueOf()).to.be(aShortTimeAgo.add(30, 'minutes').valueOf());
    });

    it('returns undefined as the expiration time of the reservation if it is already expired', function () {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.reservationExpiration(sessionId1)).to.be(undefined);
    });

    it('returns the expiration time of the waitinglist reservation if there is no regular reservation', function () {
      eventStore.state.registrationEvents = [
        events.waitinglistReservationWasIssued(singleBedRoom, sessionId1, memberId1, aShortTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.reservationExpiration(sessionId1).valueOf()).to.be(aShortTimeAgo.add(30, 'minutes').valueOf());
    });

    it('returns the expiration time of the reservation if there are both regular and waitinglist reservations', function () {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1, memberId1, aShortTimeAgo),
        events.waitinglistReservationWasIssued(singleBedRoom, sessionId1, memberId1, anEvenShorterTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.reservationExpiration(sessionId1).valueOf()).to.be(aShortTimeAgo.add(30, 'minutes').valueOf());
    });
  });

  describe('giving the reservations and participants for a room type (reservationsAndParticipantsFor)', function () {

    it('does not consider any reservations or participants when there are no events', function () {
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.reservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
    });

    it('does not consider reservations that are already expired', function () {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, memberId1, aLongTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.reservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
    });

    it('considers reservations that are still active', function () {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, memberId1, aShortTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(stripTimestamps(readModel.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
        {event: e.RESERVATION_WAS_ISSUED, sessionId: sessionId1, memberId: memberId1, roomType: singleBedRoom, duration: untilSaturday, joinedSoCraTes: aShortTimeAgo.valueOf()}]);
    });

    it('considers participations', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aLongTimeAgo),
        events.participantWasRegistered(singleBedRoom, untilSundayMorning, sessionId2, memberId2, aShortTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(stripTimestamps(readModel.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: sessionId1, memberId: memberId1, roomType: singleBedRoom, duration: untilSaturday, joinedSoCraTes: aLongTimeAgo.valueOf()},
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: sessionId2, memberId: memberId2, roomType: singleBedRoom, duration: untilSundayMorning, joinedSoCraTes: aShortTimeAgo.valueOf()}]);
    });

    it('does not consider registrations that have a matching participation', function () {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, memberId1, aShortTimeAgo),
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, anEvenShorterTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(stripTimestamps(readModel.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: sessionId1, memberId: memberId1, roomType: singleBedRoom, duration: untilSaturday, joinedSoCraTes: anEvenShorterTimeAgo.valueOf()}]);
    });

    it('does not consider DID_NOT_... reservation and registration events', function () {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, memberId1, aShortTimeAgo),
        events.didNotIssueReservationForAlreadyReservedSession(bedInDouble, untilSaturday, sessionId1, memberId1),
        events.didNotIssueReservationForFullResource(singleBedRoom, untilSaturday, sessionId2, memberId2),
        events.didNotRegisterParticipantASecondTime(singleBedRoom, untilSundayMorning, sessionId1, memberId1),
        events.didNotRegisterParticipantWithExpiredOrMissingReservation(singleBedRoom, untilSundayMorning, sessionId1, memberId1)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(stripTimestamps(readModel.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
        {event: e.RESERVATION_WAS_ISSUED, sessionId: sessionId1, memberId: memberId1, roomType: singleBedRoom, duration: untilSaturday, joinedSoCraTes: aShortTimeAgo.valueOf()}]);
      expect(readModel.reservationsAndParticipantsFor(bedInDouble)).to.eql([]);
    });

    it('returns only the events belonging to the queried room type', function () {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(bedInDouble, untilSaturday, sessionId1, memberId1, aLongTimeAgo),
        events.reservationWasIssued(singleBedRoom, untilSundayMorning, sessionId1, memberId1, aShortTimeAgo),
        events.participantWasRegistered(bedInDouble, untilSaturday, sessionId2, memberId2, aShortTimeAgo),
        events.participantWasRegistered(singleBedRoom, untilSundayMorning, sessionId1, memberId1, anEvenShorterTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(stripTimestamps(readModel.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: sessionId1, memberId: memberId1, roomType: singleBedRoom, duration: untilSundayMorning, joinedSoCraTes: anEvenShorterTimeAgo.valueOf()}]);
      expect(stripTimestamps(readModel.reservationsAndParticipantsFor(bedInDouble))).to.eql([
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: sessionId2, memberId: memberId2, roomType: bedInDouble, duration: untilSaturday, joinedSoCraTes: aShortTimeAgo.valueOf()}]);
    });

    it('does not list the registration event of a participant that has been removed', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aShortTimeAgo),
        events.participantWasRemoved(singleBedRoom, memberId1)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.reservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
    });

  });

  describe('considering removals (participantsByMemberIdFor)', function () {

    it('does not return the member id  and information of a participant that has been removed', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aShortTimeAgo),
        events.participantWasRemoved(singleBedRoom, memberId1)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.participantsByMemberIdFor(singleBedRoom)).to.eql({});
    });
  });

  describe('calculating the existence of a valid reservation (hasValidReservationFor)', function () {

    it('returns false if there are no reservations for the given session id', function () {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1, memberId1, aShortTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.hasValidReservationFor(sessionId2)).to.be(false);
    });

    it('returns true if there is a valid reservation', function () {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1, memberId1, aShortTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.hasValidReservationFor(sessionId1)).to.be(true);
    });

    it('returns false if the reservation is already expired', function () {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.hasValidReservationFor(sessionId1)).to.be(false);
    });

    it('returns true if there is a waitinglist reservation but no no regular reservation', function () {
      eventStore.state.registrationEvents = [
        events.waitinglistReservationWasIssued(singleBedRoom, sessionId1, memberId1, aShortTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.hasValidReservationFor(sessionId1)).to.be(true);
    });

    it('returns true if there are both regular and waitinglist reservations', function () {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1, memberId1, aShortTimeAgo),
        events.waitinglistReservationWasIssued(singleBedRoom, sessionId1, memberId1, anEvenShorterTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.hasValidReservationFor(sessionId1)).to.be(true);
    });
  });

  describe('for waitinglist reservations and participants (waitinglistReservationsAndParticipantsFor)', function () {
    it('does not consider any waitinglist reservations or participants when there are no events', function () {
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
      expect(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
    });

    it('does not consider reservations that are already expired', function () {
      eventStore.state.registrationEvents = [
        events.waitinglistReservationWasIssued(singleBedRoom, sessionId1, memberId1, aLongTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
    });

    it('considers reservations that are still active', function () {
      eventStore.state.registrationEvents = [
        events.waitinglistReservationWasIssued([singleBedRoom], sessionId1, memberId1, aShortTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(stripTimestamps(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom))).to.eql([
        {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionId: sessionId1, memberId: memberId1, desiredRoomTypes: [singleBedRoom], joinedWaitinglist: aShortTimeAgo.valueOf()}]);
    });

    it('considers participations', function () {
      eventStore.state.registrationEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId1, memberId1, aLongTimeAgo),
        events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId2, memberId2, aShortTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(stripTimestamps(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom))).to.eql([
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: sessionId1, memberId: memberId1, desiredRoomTypes: [singleBedRoom], joinedWaitinglist: aLongTimeAgo.valueOf()},
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: sessionId2, memberId: memberId2, desiredRoomTypes: [singleBedRoom], joinedWaitinglist: aShortTimeAgo.valueOf()}]);
    });

    it('does not consider registrations that have a matching participation', function () {
      eventStore.state.registrationEvents = [
        events.waitinglistReservationWasIssued([singleBedRoom], sessionId1, memberId1, aShortTimeAgo),
        events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId1, memberId1, anEvenShorterTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(stripTimestamps(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom))).to.eql([
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: sessionId1, memberId: memberId1, desiredRoomTypes: [singleBedRoom], joinedWaitinglist: anEvenShorterTimeAgo.valueOf()}]);
    });

    it('does not consider DID_NOT_... reservation and registration events', function () {
      eventStore.state.registrationEvents = [
        events.waitinglistReservationWasIssued([singleBedRoom], sessionId1, memberId1, aShortTimeAgo),
        events.didNotIssueWaitinglistReservationForAlreadyReservedSession([bedInDouble], sessionId1, memberId1),
        events.didNotRegisterWaitinglistParticipantASecondTime([singleBedRoom], sessionId1, memberId1),
        events.didNotRegisterWaitinglistParticipantWithExpiredOrMissingReservation([singleBedRoom], sessionId1, memberId1)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(stripTimestamps(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom))).to.eql([
        {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionId: sessionId1, memberId: memberId1, desiredRoomTypes: [singleBedRoom], joinedWaitinglist: aShortTimeAgo.valueOf()}]);
      expect(readModel.waitinglistReservationsAndParticipantsFor(bedInDouble)).to.eql([]);
    });

    it('returns only the events belonging to the queried room type', function () {
      eventStore.state.registrationEvents = [
        events.waitinglistReservationWasIssued([bedInDouble], sessionId1, memberId1, aLongTimeAgo),
        events.waitinglistReservationWasIssued([singleBedRoom], sessionId1, memberId1, aShortTimeAgo),
        events.waitinglistParticipantWasRegistered([bedInDouble], sessionId2, memberId2, aShortTimeAgo),
        events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId1, memberId1, anEvenShorterTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(stripTimestamps(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom))).to.eql([
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: sessionId1, memberId: memberId1, desiredRoomTypes: [singleBedRoom], joinedWaitinglist: anEvenShorterTimeAgo.valueOf()}]);
      expect(stripTimestamps(readModel.waitinglistReservationsAndParticipantsFor(bedInDouble))).to.eql([
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: sessionId2, memberId: memberId2, desiredRoomTypes: [bedInDouble], joinedWaitinglist: aShortTimeAgo.valueOf()}]);
    });
  });

  describe('knows about registered persons (isAlreadyRegistered)', function () {
    it('registers a registrationTuple', function () {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, memberId1, aLongTimeAgo),
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aShortTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.isAlreadyRegistered(memberId1)).to.be.true();
    });

  });

  describe('knows about a participant\'s selected options (selectedOptionsFor)', function () {

    it('returns the options for a participant', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered('single', 3, sessionId1, memberId1, aShortTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.selectedOptionsFor(memberId1)).to.be('single,3');
    });

    it('returns the options for a waitinglist participant', function () {
      eventStore.state.registrationEvents = [
        events.waitinglistParticipantWasRegistered(['single', 'junior'], sessionId1, memberId1, aShortTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.selectedOptionsFor(memberId1)).to.eql('single,waitinglist;junior,waitinglist');
    });

    it('returns the options for somebody who is participant and waitinglist participant', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered('bed_in_double', 3, sessionId1, memberId1, aShortTimeAgo),
        events.waitinglistParticipantWasRegistered(['single', 'junior'], sessionId1, memberId1, aShortTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.selectedOptionsFor(memberId1)).to.eql('bed_in_double,3;single,waitinglist;junior,waitinglist');
    });

    it('returns an empty string as the options for an unregistered member', function () {
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.selectedOptionsFor(memberId1)).to.be('');
    });

  });

  describe('knows about participants on waitinglist (isAlreadyOnWaitinglist)', function () {
    it('returns false if participant is not on waitinglist', function () {
      eventStore.state.registrationEvents = [];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.isAlreadyOnWaitinglist(memberId1)).to.eql(false);
    });

    it('returns true if participant is on waitinglist', function () {
      eventStore.state.registrationEvents = [
        events.waitinglistParticipantWasRegistered(['single', 'junior'], sessionId1, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.isAlreadyOnWaitinglist(memberId1)).to.eql(true);
    });

  });

  describe('knows if rooms are full (isFull)', function () {
    it('returns true when the room is full', function () {
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 1)];
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.isFull(singleBedRoom)).to.eql(true);
    });
    it('returns false if the room quota was not set', function () {
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(bedInDouble, 100)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.isFull(singleBedRoom)).to.eql(false);
    });

    it('is no longer full when participant was removed from full room', function () {
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 1)];
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aLongTimeAgo),
        events.participantWasRemoved(singleBedRoom, memberId1)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.isFull(singleBedRoom)).to.eql(false);
    });

    it('returns true if participant was registered from waitinglist', function () {
      eventStore.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 1)];
      eventStore.state.registrationEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.isFull(singleBedRoom)).to.eql(true);
    });

    it('returns true when person is moved by changing his room type', function () {
      eventStore.state.socratesEvents = [
        events.roomQuotaWasSet(singleBedRoom, 1),
        events.roomQuotaWasSet(bedInDouble, 1)
      ];
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aLongTimeAgo),
        events.roomTypeWasChanged(memberId1, bedInDouble, untilSaturday, aLongTimeAgo)];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.isFull(singleBedRoom)).to.eql(false);
      expect(readModel.isFull(bedInDouble)).to.eql(true);
    });
  });

  describe('knows in what room type the participant is registered (registeredInRoomType)', function () {
    it('returns the right room type for a registered participant', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
      expect(readModel.registeredInRoomType(memberId1)).to.eql(singleBedRoom);
    });

    it('returns null if member is not registered', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
      expect(readModel.registeredInRoomType(memberId2)).to.eql(null);
    });

    it('returns the right room if participant has changed the room type', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSundayMorning, sessionId1, memberId1, aLongTimeAgo),
        events.roomTypeWasChanged(memberId1, bedInDouble, untilSaturday, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.registeredInRoomType(memberId1)).to.eql(bedInDouble);
    });

    it('returns the right room if participant was moved from waitinglist', function () {
      eventStore.state.registrationEvents = [
        events.waitinglistParticipantWasRegistered([bedInDouble, singleBedRoom], sessionId1, memberId1, aLongTimeAgo),
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.registeredInRoomType(memberId1)).to.eql(singleBedRoom);
    });
  });

  describe('knows the room types of a participant or waitinglist participant (roomTypesOf)', function () {

    it('returns the correct room type for a registered participant', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSundayMorning, sessionId1, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
      expect(readModel.roomTypesOf(memberId1)).to.eql([singleBedRoom]);
    });

    it('returns the desired room types of a waitinglist participant', function () {
      eventStore.state.registrationEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom, bedInDouble], sessionId1, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.roomTypesOf(memberId1)).to.eql([singleBedRoom, bedInDouble]);
    });

    it('returns the right room types if they were changed', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aLongTimeAgo),
        events.waitinglistParticipantWasRegistered([bedInDouble], sessionId2, memberId2, aLongTimeAgo),
        events.desiredRoomTypesWereChanged(memberId2, [singleBedRoom], aLongTimeAgo),
        events.roomTypeWasChanged(memberId1, bedInDouble, untilSundayMorning, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.roomTypesOf(memberId1)).to.eql([bedInDouble]);
      expect(readModel.roomTypesOf(memberId2)).to.eql([singleBedRoom]);

    });

    it('returns the right room types when participant/waitinglist participant was removed', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSundayMorning, sessionId1, memberId1, aLongTimeAgo),
        events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId2, memberId2, aLongTimeAgo),
        events.participantWasRemoved(singleBedRoom, memberId1),
        events.waitinglistParticipantWasRemoved([singleBedRoom], memberId2)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.roomTypesOf(memberId1)).to.eql([]);
      expect(readModel.roomTypesOf(memberId2)).to.eql([]);
    });

    it('returns the registered room type even when participant is also on waitinglist', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSundayMorning, sessionId1, memberId1, aLongTimeAgo),
        events.waitinglistParticipantWasRegistered([bedInDouble], sessionId1, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.roomTypesOf(memberId1)).to.eql([singleBedRoom]);
    });
  });

  describe('Reservations and registrations for participants and waitinglist participants', function () {

    it('for a registered participant with reservation', function () {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, 2, sessionId1, memberId1, aLongTimeAgo),
        events.participantWasRegistered(singleBedRoom, 2, sessionId1, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.reservationsBySessionIdFor(singleBedRoom)).to.eql({});
      expect(R.keys(readModel.participantsByMemberIdFor(singleBedRoom))).to.eql([memberId1]);
      expect(readModel.waitinglistReservationsBySessionIdFor(singleBedRoom)).to.eql({});
      expect(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom)).to.eql({});
    });
  });

  describe('knows when a participant entered the system (joinedSoCraTesAt)', function () {
    it('when he is registered', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.joinedSoCraTesAt(memberId1)).to.eql(aLongTimeAgo);
    });

    it('when he is registered from waitinglist', function () {
      eventStore.state.registrationEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.joinedSoCraTesAt(memberId1)).to.eql(aLongTimeAgo);
    });

    it('when his room type was changed', function () {
      eventStore.state.registrationEvents = [
        events.roomTypeWasChanged(memberId1, singleBedRoom, untilSaturday, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.joinedSoCraTesAt(memberId1)).to.eql(aLongTimeAgo);
    });

    it('when his duration was changed', function () {
      eventStore.state.registrationEvents = [
        events.durationWasChanged(memberId1, singleBedRoom, untilSaturday, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.joinedSoCraTesAt(memberId1)).to.eql(aLongTimeAgo);
    });
  });

  describe('knows when a waitinglist participant entered the system (joinedWaitinglistAt)', function () {
    it('when he is registered', function () {
      eventStore.state.registrationEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId1, memberId1, aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.joinedWaitinglistAt(memberId1)).to.eql(aLongTimeAgo);
    });

    it('when his desired room types are changed', function () {
      eventStore.state.registrationEvents = [
        events.desiredRoomTypesWereChanged(memberId1, [singleBedRoom], aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      expect(readModel.joinedWaitinglistAt(memberId1)).to.eql(aLongTimeAgo);
    });
  });

  it('for a registered participant without reservation', function () {
    eventStore.state.registrationEvents = [
      events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aLongTimeAgo)
    ];
    const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

    expect(readModel.reservationsBySessionIdFor(singleBedRoom)).to.eql({});
    expect(R.keys(readModel.participantsByMemberIdFor(singleBedRoom))).to.eql([memberId1]);
    expect(readModel.waitinglistReservationsBySessionIdFor(singleBedRoom)).to.eql({});
    expect(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom)).to.eql({});
  });

  it('for a waitinglist reservation', function () {
    eventStore.state.registrationEvents = [
      events.waitinglistReservationWasIssued(singleBedRoom, sessionId1, memberId1, aLongTimeAgo),
      events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, memberId1, aLongTimeAgo),
      events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aLongTimeAgo)
    ];
    const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

    expect(readModel.reservationsBySessionIdFor(singleBedRoom)).to.eql({});
    expect(R.keys(readModel.participantsByMemberIdFor(singleBedRoom))).to.eql([memberId1]);
    expect(readModel.waitinglistReservationsBySessionIdFor(singleBedRoom)).to.eql({});
    expect(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom)).to.eql({});
  });

  it('for a waitinglist participant to a participant', function () {
    eventStore.state.registrationEvents = [
      events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId1, memberId1, aLongTimeAgo),
      events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, memberId1, aLongTimeAgo),
      events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aLongTimeAgo)
    ];
    const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

    expect(readModel.reservationsBySessionIdFor(singleBedRoom)).to.eql({});
    expect(R.keys(readModel.participantsByMemberIdFor(singleBedRoom))).to.eql([memberId1]);
    expect(readModel.waitinglistReservationsBySessionIdFor(singleBedRoom)).to.eql({});
    expect(R.keys(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom))).to.eql([memberId1]);
  });

  it('for a already registered participant', function () {
    eventStore.state.registrationEvents = [
      events.participantWasRegistered(singleBedRoom, untilSundayMorning, sessionId1, memberId1, aLongTimeAgo),
      events.didNotRegisterParticipantASecondTime(singleBedRoom, untilSundayMorning, sessionId1, memberId1)
    ];
    const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

    expect(readModel.reservationsBySessionIdFor(singleBedRoom)).to.eql({});
    expect(R.keys(readModel.participantsByMemberIdFor(singleBedRoom))).to.eql([memberId1]);
    expect(readModel.waitinglistReservationsBySessionIdFor(singleBedRoom)).to.eql({});
    expect(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom)).to.eql({});
  });

  it('for a waitinglist participant registering with reservation', function () {
    eventStore.state.registrationEvents = [
      events.waitinglistReservationWasIssued([singleBedRoom], sessionId1, memberId1, aLongTimeAgo),
      events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId1, memberId1, aLongTimeAgo)
    ];
    const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

    expect(readModel.reservationsBySessionIdFor(singleBedRoom)).to.eql({});
    expect(readModel.participantsByMemberIdFor(singleBedRoom)).to.eql({});
    expect(readModel.waitinglistReservationsBySessionIdFor(singleBedRoom)).to.eql({});
    expect(R.keys(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom))).to.eql([memberId1]);
  });

  it('for a waitinglist participant registering without reservation', function () {
    eventStore.state.registrationEvents = [
      events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId1, memberId1, aLongTimeAgo)
    ];
    const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
    expect(readModel.reservationsBySessionIdFor(singleBedRoom)).to.eql({});
    expect(readModel.participantsByMemberIdFor(singleBedRoom)).to.eql({});
    expect(readModel.waitinglistReservationsBySessionIdFor(singleBedRoom)).to.eql({});
    expect(R.keys(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom))).to.eql([memberId1]);
  });

  it('for a registered participant with reservation', function () {
    eventStore.state.registrationEvents = [
      events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, memberId1, moment().subtract(1, 'hours')),
      events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aShortTimeAgo)
    ];
    const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

    expect(readModel.reservationsBySessionIdFor(singleBedRoom)).to.eql({});
    expect(R.keys(readModel.participantsByMemberIdFor(singleBedRoom))).to.eql([memberId1]);
    expect(readModel.waitinglistReservationsBySessionIdFor(singleBedRoom)).to.eql({});
    expect(readModel.waitinglistParticipantsByMemberIdFor(singleBedRoom)).to.eql({});
  });

});
