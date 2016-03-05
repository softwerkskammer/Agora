'use strict';

var expect = require('must-dist');
var moment = require('moment-timezone');
var _ = require('lodash');
var R = require('ramda');

var beans = require('../../testutil/configureForTest').get('beans');
var events = beans.get('events');
var SoCraTesEventStore = beans.get('SoCraTesEventStore');
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
var anEvenShorterTimeAgo = moment.tz().subtract(5, 'minutes');

var sessionId1 = 'session-id-1';
var sessionId2 = 'session-id-2';
var singleBedRoom = 'singleBedRoom';
var bedInDouble = 'bedInDouble';
var memberId1 = 'member-id-1';
var memberId2 = 'member-id-2';

function setTimestamp(event, timestamp) {
  event.timestamp = timestamp;
  return event;
}

describe('The socrates conference write model for waitinglist reservations and participants', function () {
  it('does not consider any waitinglist reservations or participants when there are no events', function () {
    var socrates = new SoCraTesEventStore();

    expect(socrates.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
  });

  it('does not consider reservations that are already expired', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      setTimestamp(events.waitinglistReservationWasIssued(singleBedRoom, sessionId1), aLongTimeAgo)];

    expect(socrates.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
  });

  it('considers reservations that are still active', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      setTimestamp(events.waitinglistReservationWasIssued(singleBedRoom, sessionId1), aShortTimeAgo)];

    expect(socrates.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([
      {
        event: e.WAITINGLIST_RESERVATION_WAS_ISSUED,
        sessionID: sessionId1,
        desiredRoomTypes: [singleBedRoom],
        timestamp: aShortTimeAgo
      }]);
  });

  it('considers participations', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      setTimestamp(events.waitinglistParticipantWasRegistered(singleBedRoom, sessionId1, memberId1), aLongTimeAgo),
      setTimestamp(events.waitinglistParticipantWasRegistered(singleBedRoom, sessionId2, memberId2), aShortTimeAgo)];

    expect(socrates.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([
      {
        event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        memberId: memberId1,
        desiredRoomTypes: [singleBedRoom],
        timestamp: aLongTimeAgo
      },
      {
        event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId2,
        memberId: memberId2,
        desiredRoomTypes: [singleBedRoom],
        timestamp: aShortTimeAgo
      }]);
  });

  it('does not consider registrations that have a matching participation', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      setTimestamp(events.waitinglistReservationWasIssued(singleBedRoom, sessionId1), aShortTimeAgo),
      setTimestamp(events.waitinglistParticipantWasRegistered(singleBedRoom, sessionId1, memberId1), anEvenShorterTimeAgo)];

    expect(socrates.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([
      {
        event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        memberId: memberId1,
        desiredRoomTypes: [singleBedRoom],
        timestamp: anEvenShorterTimeAgo
      }]);
  });

  it('does not consider DID_NOT_... reservation and registration events', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      setTimestamp(events.waitinglistReservationWasIssued(singleBedRoom, sessionId1), aShortTimeAgo),
      setTimestamp(events.didNotIssueWaitinglistReservationForAlreadyReservedSession(bedInDouble, sessionId1), aShortTimeAgo),
      setTimestamp(events.didNotRegisterParticipantASecondTime(singleBedRoom, sessionId1, memberId1), aShortTimeAgo)
    ];

    expect(socrates.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([
      {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId1, desiredRoomTypes: [singleBedRoom], timestamp: aShortTimeAgo}]);
    expect(socrates.waitinglistReservationsAndParticipantsFor(bedInDouble)).to.eql([]);
  });

  it('returns only the events belonging to the queried room type', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      setTimestamp(events.waitinglistReservationWasIssued(bedInDouble, sessionId1), aLongTimeAgo),
      setTimestamp(events.waitinglistReservationWasIssued(singleBedRoom, sessionId1), aShortTimeAgo),
      setTimestamp(events.waitinglistParticipantWasRegistered(bedInDouble, sessionId2, memberId2), aShortTimeAgo),
      setTimestamp(events.waitinglistParticipantWasRegistered(singleBedRoom, sessionId1, memberId1), anEvenShorterTimeAgo)];

    expect(socrates.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([
      {
        event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        memberId: memberId1,
        desiredRoomTypes: [singleBedRoom],
        timestamp: anEvenShorterTimeAgo
      }]);
    expect(socrates.waitinglistReservationsAndParticipantsFor(bedInDouble)).to.eql([
      {
        event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId2,
        memberId: memberId2,
        desiredRoomTypes: [bedInDouble],
        timestamp: aShortTimeAgo
      }]);
  });
});

describe('The socrates conference command handler for waitinglist reservations', function () {
  it('reserves a spot on the waitinglist', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();

    socrates.state.resourceEvents = [];

    // When (issued command)
    socrates.issueWaitinglistReservation(singleBedRoom, sessionId1);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId1, desiredRoomTypes: [singleBedRoom]}]);
    // And (new write model)
    expect(stripTimestamps(socrates.waitinglistReservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId1, desiredRoomTypes: [singleBedRoom]}]);
  });

  it('reserves a spot on the waitinglist when an expired reservation exists', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();

    socrates.state.resourceEvents = [
      setTimestamp(events.waitinglistReservationWasIssued(singleBedRoom, sessionId1), aLongTimeAgo)];

    // When (issued command)
    socrates.issueWaitinglistReservation(singleBedRoom, sessionId2);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId1, desiredRoomTypes: [singleBedRoom]},
      {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId2, desiredRoomTypes: [singleBedRoom]}]);
    // And (new write model)
    expect(stripTimestamps(socrates.waitinglistReservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId2, desiredRoomTypes: [singleBedRoom]}]);
  });

  it('disregards a reservation if there is a matching booking', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();

    socrates.state.resourceEvents = [
      events.waitinglistReservationWasIssued(singleBedRoom, sessionId1, aShortTimeAgo),
      events.waitinglistParticipantWasRegistered(singleBedRoom, sessionId1, memberId1)];

    // When (issued command)
    socrates.issueWaitinglistReservation(singleBedRoom, sessionId2);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId1, desiredRoomTypes: [singleBedRoom]},
      {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, memberId: memberId1, desiredRoomTypes: [singleBedRoom]},
      {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId2, desiredRoomTypes: [singleBedRoom]}]);
    // And (new write model)
    expect(stripTimestamps(socrates.waitinglistReservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId2, desiredRoomTypes: [singleBedRoom]},
      {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, memberId: memberId1, desiredRoomTypes: [singleBedRoom]}]);
  });

  it('does not allow a registration for any resource if there is already an active registration for the same session id', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();

    socrates.state.resourceEvents = [
      events.waitinglistReservationWasIssued(singleBedRoom, sessionId1, aShortTimeAgo)];

    // When (issued command)
    socrates.issueWaitinglistReservation(bedInDouble, sessionId1);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId1, desiredRoomTypes: [singleBedRoom]},
      {event: e.DID_NOT_ISSUE_WAITINGLIST_RESERVATION_FOR_ALREADY_RESERVED_SESSION, sessionID: sessionId1, desiredRoomTypes: [bedInDouble]}]);
    // And (new write model)
    expect(stripTimestamps(socrates.waitinglistReservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId1, desiredRoomTypes: [singleBedRoom]}]);
    expect(stripTimestamps(socrates.waitinglistReservationsAndParticipantsFor(bedInDouble))).to.eql([]);
  });
});

describe('The socrates conference command handler for waitinglist registrations', function () {
  it('registers a spot on the waitinglist', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      events.waitinglistReservationWasIssued(singleBedRoom, sessionId1, aShortTimeAgo)];

    // When (issued command)
    socrates.registerWaitinglistParticipant(singleBedRoom, sessionId1, memberId1);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId1, desiredRoomTypes: [singleBedRoom]},
      {
        event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        desiredRoomTypes: [singleBedRoom],
        memberId: memberId1
      }]);
    // And (new write model)
    expect(stripTimestamps(socrates.waitinglistReservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {
        event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        desiredRoomTypes: [singleBedRoom],
        memberId: memberId1
      }]);
  });

  it('registers a spot on the waitinglist even if there was an expired reservation', function () { // TODO books a room?
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      events.waitinglistReservationWasIssued(singleBedRoom, sessionId1, aLongTimeAgo)];

    // When (issued command)
    socrates.registerWaitinglistParticipant(singleBedRoom, sessionId1, memberId1);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId1, desiredRoomTypes: [singleBedRoom]},
      {
        event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        desiredRoomTypes: [singleBedRoom],
        memberId: memberId1
      }]);
    // And (new write model)
    expect(stripTimestamps(socrates.waitinglistReservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {
        event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        desiredRoomTypes: [singleBedRoom],
        memberId: memberId1
      }]);
  });

  it('registers a spot on the waitinglist even if there was no reservation', function () { // TODO books a room?
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [];

    // When (issued command)
    socrates.registerWaitinglistParticipant(singleBedRoom, sessionId1, memberId1);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {
        event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        desiredRoomTypes: [singleBedRoom],
        memberId: memberId1
      }]);
    // And (new write model)
    expect(stripTimestamps(socrates.waitinglistReservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {
        event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        desiredRoomTypes: [singleBedRoom],
        memberId: memberId1
      }]);
  });

  it('does not register two spots on the waitinglist for the same member, not even for different rooms', function () { // TODO books a room?
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      events.waitinglistParticipantWasRegistered(singleBedRoom, sessionId1, memberId1)
    ];

    // When (issued command)
    socrates.registerWaitinglistParticipant(bedInDouble, sessionId1, memberId1);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {
        event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        desiredRoomTypes: [singleBedRoom],
        memberId: memberId1
      },
      {
        event: e.DID_NOT_REGISTER_PARTICIPANT_A_SECOND_TIME,
        sessionID: sessionId1,
        roomType: bedInDouble,
        duration: 'waitinglist',
        memberId: memberId1
      }
    ]);
    // And (new write model)
    expect(stripTimestamps(socrates.waitinglistReservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {
        event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        desiredRoomTypes: [singleBedRoom],
        memberId: memberId1
      }]);
    expect(stripTimestamps(socrates.waitinglistReservationsAndParticipantsFor(bedInDouble))).to.eql([]);
  });
});
