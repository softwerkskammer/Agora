'use strict';

var expect = require('must-dist');
var moment = require('moment-timezone');
var _ = require('lodash');
var R = require('ramda');

var beans = require('../../testutil/configureForTest').get('beans');
var events = beans.get('events');
var SoCraTesEventStore = require('../../lib/eventstore/SoCraTesEventStore');

var ROOM_QUOTA_WAS_SET = 'ROOM-QUOTA-WAS-SET';
var RESERVATION_WAS_ISSUED = 'RESERVATION-WAS-ISSUED';
var DID_NOT_ISSUE_RESERVATION_FOR_ALREADY_RESERVED_SESSION = 'DID_NOT_ISSUE_RESERVATION_FOR_ALREADY_RESERVED_SESSION';
var DID_NOT_ISSUE_RESERVATION_FOR_FULL_RESOURCE = 'DID_NOT_ISSUE_RESERVATION_FOR_FULL_RESOURCE';
var PARTICIPANT_WAS_REGISTERED = 'PARTICIPANT-WAS-REGISTERED';
var DID_NOT_REGISTER_PARTICIPANT_FOR_FULL_RESOURCE = 'DID_NOT_REGISTER_PARTICIPANT_FOR_FULL_RESOURCE';
var DID_NOT_REGISTER_PARTICIPANT_A_SECOND_TIME = 'DID_NOT_REGISTER_PARTICIPANT_A_SECOND_TIME';
var ROOM_TYPE_WAS_CHANGED = 'ROOM-TYPE-WAS-CHANGED';
var DURATION_WAS_CHANGED = 'DURATION-WAS-CHANGED';
var DID_NOT_CHANGE_ROOM_TYPE_FOR_NON_PARTICIPANT = 'DID-NOT-CHANGE-ROOM-TYPE-FOR-NON-PARTICIPANT';
var DID_NOT_CHANGE_DURATION_FOR_NON_PARTICIPANT = 'DID-NOT-CHANGE-DURATION-FOR-NON-PARTICIPANT';

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

describe('the socrates conference write model', function () {
  it('does not know the quota if it has not been set', function () {
    var socrates = new SoCraTesEventStore();

    expect(socrates.quotaFor(singleBedRoom)).to.be(undefined);
  });

  it('determines the quota from the socrates event', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 100)];

    expect(socrates.quotaFor(singleBedRoom)).to.be(100);
  });

  it('determines the quota from the latest socrates event for the requested room type', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.socratesEvents = [
      events.roomQuotaWasSet(singleBedRoom, 100),
      events.roomQuotaWasSet(singleBedRoom, 200),
      events.roomQuotaWasSet(bedInDouble, 300)];

    expect(socrates.quotaFor(singleBedRoom)).to.be(200);
    expect(socrates.quotaFor(bedInDouble)).to.be(300);
  });

  it('does not consider any reservations or participants when there are no events', function () {
    var socrates = new SoCraTesEventStore();

    expect(socrates.reservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
  });

  it('does not consider reservations that are already expired', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      setTimestamp(events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1), aLongTimeAgo)];

    expect(socrates.reservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
  });

  it('considers reservations that are still active', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      setTimestamp(events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1), aShortTimeAgo)];

    expect(socrates.reservationsAndParticipantsFor(singleBedRoom)).to.eql([
      {
        event: RESERVATION_WAS_ISSUED,
        sessionID: sessionId1,
        roomType: singleBedRoom,
        duration: untilSaturday,
        timestamp: aShortTimeAgo
      }]);
  });

  it('considers participations', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      setTimestamp(events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1), aLongTimeAgo),
      setTimestamp(events.participantWasRegistered(singleBedRoom, untilSundayMorning, sessionId2, memberId2), aShortTimeAgo)];

    expect(socrates.reservationsAndParticipantsFor(singleBedRoom)).to.eql([
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        memberId: memberId1,
        roomType: singleBedRoom,
        duration: untilSaturday,
        timestamp: aLongTimeAgo
      },
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId2,
        memberId: memberId2,
        roomType: singleBedRoom,
        duration: untilSundayMorning,
        timestamp: aShortTimeAgo
      }]);
  });

  it('does not consider registrations that have a matching participation', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      setTimestamp(events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1), aShortTimeAgo),
      setTimestamp(events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1), anEvenShorterTimeAgo)];

    expect(socrates.reservationsAndParticipantsFor(singleBedRoom)).to.eql([
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        memberId: memberId1,
        roomType: singleBedRoom,
        duration: untilSaturday,
        timestamp: anEvenShorterTimeAgo
      }]);
  });

  it('does not consider DID_NOT_... reservation and registration events', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      setTimestamp(events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1), aShortTimeAgo),
      setTimestamp(events.didNotIssueReservationForAlreadyReservedSession(bedInDouble, untilSaturday, sessionId1), aShortTimeAgo),
      setTimestamp(events.didNotIssueReservationForFullResource(singleBedRoom, untilSaturday, sessionId2), aShortTimeAgo),
      setTimestamp(events.didNotRegisterParticipantForFullResource(singleBedRoom, untilSundayMorning, sessionId1, memberId1), aShortTimeAgo),
      setTimestamp(events.didNotRegisterParticipantASecondTime(singleBedRoom, untilSundayMorning, sessionId1, memberId1), aShortTimeAgo)
    ];

    expect(socrates.reservationsAndParticipantsFor(singleBedRoom)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday, timestamp: aShortTimeAgo}]);
    expect(socrates.reservationsAndParticipantsFor(bedInDouble)).to.eql([]);
  });

  it('returns only the events belonging to the queried room type', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      setTimestamp(events.reservationWasIssued(bedInDouble, untilSaturday, sessionId1), aLongTimeAgo),
      setTimestamp(events.reservationWasIssued(singleBedRoom, untilSundayMorning, sessionId1), aShortTimeAgo),
      setTimestamp(events.participantWasRegistered(bedInDouble, untilSaturday, sessionId2, memberId2), aShortTimeAgo),
      setTimestamp(events.participantWasRegistered(singleBedRoom, untilSundayMorning, sessionId1, memberId1), anEvenShorterTimeAgo)];

    expect(socrates.reservationsAndParticipantsFor(singleBedRoom)).to.eql([
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        memberId: memberId1,
        roomType: singleBedRoom,
        duration: untilSundayMorning,
        timestamp: anEvenShorterTimeAgo
      }]);
    expect(socrates.reservationsAndParticipantsFor(bedInDouble)).to.eql([
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId2,
        memberId: memberId2,
        roomType: bedInDouble,
        duration: untilSaturday,
        timestamp: aShortTimeAgo
      }]);
  });
});

describe('the socrates conference command handler for room quota changes', function () {
  it('changes the quota', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();

    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 100)];
    socrates.state.resourceEvents = [];

    // When (issued command)
    socrates.updateRoomQuota(singleBedRoom, 150);

    // Then (new events)
    expect(stripTimestamps(socrates.state.socratesEvents)).to.eql([
      {event: ROOM_QUOTA_WAS_SET, roomType: singleBedRoom, quota: 100},
      {event: ROOM_QUOTA_WAS_SET, roomType: singleBedRoom, quota: 150}
    ]);
    // And (new write model)
    expect(socrates.quotaFor(singleBedRoom)).to.eql(150);
  });
});

describe('the socrates conference command handler for room reservations', function () {
  it('reserves a room if the quota is not yet exceeded', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();

    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 100)];
    socrates.state.resourceEvents = [];

    // When (issued command)
    socrates.issueReservation(singleBedRoom, untilSaturday, sessionId1);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday}]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday}]);
  });

  it('does not reserve a room if the quota is already exhausted by an active reservation', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();

    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 1)];
    socrates.state.resourceEvents = [
      events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, aShortTimeAgo)];

    // When (issued command)
    socrates.issueReservation(singleBedRoom, untilSundayMorning, sessionId2);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
      {
        event: DID_NOT_ISSUE_RESERVATION_FOR_FULL_RESOURCE,
        sessionID: sessionId2,
        roomType: singleBedRoom,
        duration: untilSundayMorning
      }
    ]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday}]);
  });

  it('reserves a room when an expired reservation exists', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();

    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 1)];
    socrates.state.resourceEvents = [
      setTimestamp(events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1), aLongTimeAgo)];

    // When (issued command)
    socrates.issueReservation(singleBedRoom, untilSundayMorning, sessionId2);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId2, roomType: singleBedRoom, duration: untilSundayMorning}]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId2, roomType: singleBedRoom, duration: untilSundayMorning}]);
  });

  it('does not reserve a room if the quota is already exhausted by a registration', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();

    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 1)];
    socrates.state.resourceEvents = [
      events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, aShortTimeAgo),
      events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1)];

    // When (issued command)
    socrates.issueReservation(singleBedRoom, untilSaturday, sessionId2);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        memberId: memberId1,
        roomType: singleBedRoom,
        duration: untilSaturday
      },
      {
        event: DID_NOT_ISSUE_RESERVATION_FOR_FULL_RESOURCE,
        sessionID: sessionId2,
        roomType: singleBedRoom,
        duration: untilSaturday
      }
    ]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        memberId: memberId1,
        roomType: singleBedRoom,
        duration: untilSaturday
      }]);
  });

  it('does not count a reservation and its matching booking towards the quota', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();

    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 2)];
    socrates.state.resourceEvents = [
      events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, aShortTimeAgo),
      events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1)];

    // When (issued command)
    socrates.issueReservation(singleBedRoom, untilSaturday, sessionId2);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        memberId: memberId1,
        roomType: singleBedRoom,
        duration: untilSaturday
      },
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId2, roomType: singleBedRoom, duration: untilSaturday}]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId2, roomType: singleBedRoom, duration: untilSaturday},
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        memberId: memberId1,
        roomType: singleBedRoom,
        duration: untilSaturday
      }]);
  });

  it('does not allow a registration for any resource if there is already an active registration for the same session id', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();

    socrates.state.socratesEvents = [
      events.roomQuotaWasSet(singleBedRoom, 100),
      events.roomQuotaWasSet(bedInDouble, 100)];
    socrates.state.resourceEvents = [
      events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, aShortTimeAgo)];

    // When (issued command)
    socrates.issueReservation(bedInDouble, untilSaturday, sessionId1);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
      {
        event: DID_NOT_ISSUE_RESERVATION_FOR_ALREADY_RESERVED_SESSION,
        sessionID: sessionId1,
        roomType: bedInDouble,
        duration: untilSaturday
      }]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday}]);
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(bedInDouble))).to.eql([]);
  });
});

describe('the socrates conference command handler for room registrations', function () {
  it('registers a room', function () { // TODO books a room?
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 100)];
    socrates.state.resourceEvents = [
      events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, aShortTimeAgo)];

    // When (issued command)
    socrates.registerParticipant(singleBedRoom, untilSaturday, sessionId1, memberId1);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        roomType: singleBedRoom,
        duration: untilSaturday,
        memberId: memberId1
      }]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        roomType: singleBedRoom,
        duration: untilSaturday,
        memberId: memberId1
      }]);
  });

  it('registers a room even if the matching reservation filled up the room', function () { // TODO books a room?
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 1)];
    socrates.state.resourceEvents = [
      events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, aShortTimeAgo)];

    // When (issued command)
    socrates.registerParticipant(singleBedRoom, untilSaturday, sessionId1, memberId1);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        roomType: singleBedRoom,
        duration: untilSaturday,
        memberId: memberId1
      }]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        roomType: singleBedRoom,
        duration: untilSaturday,
        memberId: memberId1
      }]);
  });

  it('registers a room for the given duration even if the reservation was for a different duration', function () { // TODO books a room?
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 100)];
    socrates.state.resourceEvents = [
      events.reservationWasIssued(singleBedRoom, untilSundayMorning, sessionId1, aShortTimeAgo)];

    // When (issued command)
    socrates.registerParticipant(singleBedRoom, untilSaturday, sessionId1, memberId1);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSundayMorning},
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        roomType: singleBedRoom,
        duration: untilSaturday,
        memberId: memberId1
      }]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        roomType: singleBedRoom,
        duration: untilSaturday,
        memberId: memberId1
      }]);
  });

  it('registers a room even if there was an expired reservation, if there was enough space', function () { // TODO books a room?
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 1)];
    socrates.state.resourceEvents = [
      events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, aLongTimeAgo)];

    // When (issued command)
    socrates.registerParticipant(singleBedRoom, untilSaturday, sessionId1, memberId1);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        roomType: singleBedRoom,
        duration: untilSaturday,
        memberId: memberId1
      }]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        roomType: singleBedRoom,
        duration: untilSaturday,
        memberId: memberId1
      }]);
  });

  it('does not register a room if there was an expired reservation but if there was not enough space', function () { // TODO books a room?
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 1)];
    socrates.state.resourceEvents = [
      setTimestamp(events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1), aLongTimeAgo),
      events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId2, memberId2)];

    // When (issued command)
    socrates.registerParticipant(singleBedRoom, untilSaturday, sessionId1, memberId1);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId2,
        roomType: singleBedRoom,
        duration: untilSaturday,
        memberId: memberId2
      },
      {
        event: DID_NOT_REGISTER_PARTICIPANT_FOR_FULL_RESOURCE,
        sessionID: sessionId1,
        roomType: singleBedRoom,
        duration: untilSaturday,
        memberId: memberId1
      }
    ]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId2,
        roomType: singleBedRoom,
        duration: untilSaturday,
        memberId: memberId2
      }]);
  });

  it('registers a room even if there was no reservation, if there was enough space', function () { // TODO books a room?
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 100)];
    socrates.state.resourceEvents = [];

    // When (issued command)
    socrates.registerParticipant(singleBedRoom, untilSaturday, sessionId1, memberId1);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        roomType: singleBedRoom,
        duration: untilSaturday,
        memberId: memberId1
      }]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        roomType: singleBedRoom,
        duration: untilSaturday,
        memberId: memberId1
      }]);
  });

  it('does register two rooms for the same member, not even different rooms', function () { // TODO books a room?
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 100)];
    socrates.state.resourceEvents = [
      events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1)
    ];

    // When (issued command)
    socrates.registerParticipant(bedInDouble, untilSaturday, sessionId1, memberId1);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        roomType: singleBedRoom,
        duration: untilSaturday,
        memberId: memberId1
      },
      {
        event: DID_NOT_REGISTER_PARTICIPANT_A_SECOND_TIME,
        sessionID: sessionId1,
        roomType: bedInDouble,
        duration: untilSaturday,
        memberId: memberId1
      }
    ]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        roomType: singleBedRoom,
        duration: untilSaturday,
        memberId: memberId1
      }]);
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(bedInDouble))).to.eql([]);
  });
});

describe('the socrates conference command handler for room type changes', function () {
  it('moves the participant to the new room type without caring about the new room limit', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.state.socratesEvents = [events.roomQuotaWasSet(bedInDouble, 0)];
    socrates.state.resourceEvents = [
      events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, aLongTimeAgo),
      events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aShortTimeAgo)];

    // When (issued command)
    socrates.moveParticipantToNewRoomType(memberId1, bedInDouble);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        roomType: singleBedRoom,
        duration: untilSaturday,
        memberId: memberId1
      },
      {event: ROOM_TYPE_WAS_CHANGED, memberId: memberId1, roomType: bedInDouble, duration: untilSaturday}]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([]);
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(bedInDouble))).to.eql([
      {event: ROOM_TYPE_WAS_CHANGED, memberId: memberId1, roomType: bedInDouble, duration: untilSaturday}]);
  });

  it('multiple room changes keep moving the participant to the new room types', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.state.socratesEvents = [events.roomQuotaWasSet(bedInDouble, 0)];
    socrates.state.resourceEvents = [
      events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, aLongTimeAgo),
      events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aShortTimeAgo),
      events.roomTypeWasChanged(memberId1, bedInDouble, untilSaturday)
    ];

    // When (issued command)
    socrates.moveParticipantToNewRoomType(memberId1, kingSuite);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        roomType: singleBedRoom,
        duration: untilSaturday,
        memberId: memberId1
      },
      {event: ROOM_TYPE_WAS_CHANGED, memberId: memberId1, roomType: bedInDouble, duration: untilSaturday},
      {event: ROOM_TYPE_WAS_CHANGED, memberId: memberId1, roomType: kingSuite, duration: untilSaturday}
    ]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([]);
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(bedInDouble))).to.eql([]);
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(kingSuite))).to.eql([
      {event: ROOM_TYPE_WAS_CHANGED, memberId: memberId1, roomType: kingSuite, duration: untilSaturday}]);
  });

  it('appends an error event if the member has not actually been a participant', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.state.socratesEvents = [events.roomQuotaWasSet(bedInDouble, 10)];
    socrates.state.resourceEvents = [];

    // When (issued command)
    socrates.moveParticipantToNewRoomType(memberId1, bedInDouble);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: DID_NOT_CHANGE_ROOM_TYPE_FOR_NON_PARTICIPANT, memberId: memberId1, roomType: bedInDouble}]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([]);
  });
});

describe('the socrates conference command handler for duration changes', function () {
  it('moves the participant to the new duration', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 10)];
    socrates.state.resourceEvents = [
      events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, aLongTimeAgo),
      events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aShortTimeAgo)];

    // When (issued command)
    socrates.setNewDurationForParticipant(memberId1, untilSundayMorning);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        roomType: singleBedRoom,
        duration: untilSaturday,
        memberId: memberId1
      },
      {event: DURATION_WAS_CHANGED, memberId: memberId1, roomType: singleBedRoom, duration: untilSundayMorning}]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {event: DURATION_WAS_CHANGED, memberId: memberId1, roomType: singleBedRoom, duration: untilSundayMorning}]);
  });

  it('multiple duration changes keep moving the participant to the new duration', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.state.socratesEvents = [events.roomQuotaWasSet(bedInDouble, 0)];
    socrates.state.resourceEvents = [
      events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1, aLongTimeAgo),
      events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1, aShortTimeAgo),
      events.durationWasChanged(memberId1, singleBedRoom, untilSundayMorning)
    ];

    // When (issued command)
    socrates.setNewDurationForParticipant(memberId1, untilSundayEvening);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, duration: untilSaturday},
      {
        event: PARTICIPANT_WAS_REGISTERED,
        sessionID: sessionId1,
        roomType: singleBedRoom,
        duration: untilSaturday,
        memberId: memberId1
      },
      {event: DURATION_WAS_CHANGED, memberId: memberId1, roomType: singleBedRoom, duration: untilSundayMorning},
      {event: DURATION_WAS_CHANGED, memberId: memberId1, roomType: singleBedRoom, duration: untilSundayEvening}
    ]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {event: DURATION_WAS_CHANGED, memberId: memberId1, roomType: singleBedRoom, duration: untilSundayEvening}]);
  });

  it('appends an error event if the member has not actually been a participant', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.state.socratesEvents = [events.roomQuotaWasSet(bedInDouble, 10)];
    socrates.state.resourceEvents = [];

    // When (issued command)
    socrates.setNewDurationForParticipant(memberId1, untilSaturday);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: DID_NOT_CHANGE_DURATION_FOR_NON_PARTICIPANT, memberId: memberId1, duration: untilSaturday}]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([]);
  });
});
