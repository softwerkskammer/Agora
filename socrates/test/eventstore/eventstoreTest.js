'use strict';
var expect = require('must-dist');
var moment = require('moment-timezone');
var _ = require('lodash');

var beans = require('../../testutil/configureForTest').get('beans');
var events = beans.get('events');
var SoCraTesEventStore = require('../../lib/eventstore/eventstore');

var RESERVATION_WAS_ISSUED = 'RESERVATION-WAS-ISSUED';
var PARTICIPANT_WAS_REGISTERED = 'PARTICIPANT-WAS-REGISTERED';

function stripTimestamps(events) {
  return _.map(events, function(event) {
    delete event.timestamp;
    return event;
  });
}

var aLongTimeAgo = moment.tz().subtract(40, 'minutes');
var aShortTimeAgo = moment.tz().subtract(10, 'minutes');
var anEvenShorterTimeAgo = moment.tz().subtract(5, 'minutes');

var sessionId1 = 'session-id-1';
var sessionId2 = 'session-id-2';

describe('the socrates conference write model', function () {
  it('does not know the quota if it has not been set', function () {
    var socrates = new SoCraTesEventStore();

    expect(socrates.quota()).to.be(undefined);
  });

  it('determines the quota from the socrates event', function () {
    var socrates = new SoCraTesEventStore();
    socrates.socratesEvents = [events.roomQuotaWasSet('singleBedRoom', 100)];

    expect(socrates.quota()).to.be(100);
  });

  it('determines the quota from the latest socrates event', function () {
    var socrates = new SoCraTesEventStore();
    socrates.socratesEvents = [events.roomQuotaWasSet('singleBedRoom', 100), events.roomQuotaWasSet('singleBedRoom', 200)];

    expect(socrates.quota()).to.be(200);
  });

  it('does not consider any reservations or participants when there are no events', function () {
    var socrates = new SoCraTesEventStore();

    expect(socrates.reservationsAndParticipants()).to.eql([]);
  });

  it('does not consider reservations that are already expired', function () {
    var socrates = new SoCraTesEventStore();
    socrates.resourceEvents = [{event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, timestamp: aLongTimeAgo}];

    expect(socrates.reservationsAndParticipants()).to.eql([]);
  });

  it('considers reservations that are still active', function () {
    var socrates = new SoCraTesEventStore();
    socrates.resourceEvents = [{event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, timestamp: aShortTimeAgo}];

    expect(socrates.reservationsAndParticipants()).to.eql([{event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, timestamp: aShortTimeAgo}]);
  });

  it('considers participations', function () {
    var socrates = new SoCraTesEventStore();
    socrates.resourceEvents = [{event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, timestamp: aLongTimeAgo}, {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId2, timestamp: aShortTimeAgo}];

    expect(socrates.reservationsAndParticipants()).to.eql([{event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, timestamp: aLongTimeAgo},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId2, timestamp: aShortTimeAgo}]);
  });

  it('does not consider registrations that have a matching participation', function () {
    var socrates = new SoCraTesEventStore();
    socrates.resourceEvents = [{event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, timestamp: aShortTimeAgo},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, timestamp: anEvenShorterTimeAgo}];

    expect(socrates.reservationsAndParticipants()).to.eql([{event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, timestamp: anEvenShorterTimeAgo}]);
  });
});

describe('the socrates conference command handler', function () {
  it('reserves a room if the quota is not yet exceeded', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    // es werden 100 single bed rooms freigeschaltet

    var roomType = 'singleBedRoom';
    socrates.socratesEvents = [events.roomQuotaWasSet(roomType, 100)];
    socrates.resourceEvents = [];

    // When (issued command)
    socrates.issueReservation(roomType, sessionId1);

    // Then (new events)
    expect(stripTimestamps(socrates.resourceEvents)).to.eql([{event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: roomType}]);
  });

  it('does not reserve a room if the quota is already exhausted by an active reservation', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    // es werden 1 single bed rooms freigeschaltet
    var roomType = 'singleBedRoom';
    socrates.socratesEvents = [events.roomQuotaWasSet(roomType, 1)];
    socrates.resourceEvents = [{event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: roomType, timestamp: aShortTimeAgo}];

    // When (issued command)
    socrates.issueReservation(roomType, sessionId2);

    // Then (new events)
    expect(stripTimestamps(socrates.resourceEvents)).to.eql([{event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: roomType}]);
  });

  it('reserves a room when an expired reservation exists', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    // es werden 1 single bed rooms freigeschaltet
    var roomType = 'singleBedRoom';
    socrates.socratesEvents = [events.roomQuotaWasSet(roomType, 1)];
    socrates.resourceEvents = [{event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: roomType, timestamp: aLongTimeAgo}];

    // When (issued command)
    socrates.issueReservation(roomType, sessionId2);

    // Then (new events)
    expect(stripTimestamps(socrates.resourceEvents)).to.eql([{event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: roomType},
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId2, roomType: roomType}]);
  });

  it('does not reserve a room if the quota is already exhausted by a registration', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    // es werden 1 single bed rooms freigeschaltet
    var roomType = 'singleBedRoom';
    socrates.socratesEvents = [events.roomQuotaWasSet(roomType, 1)];
    socrates.resourceEvents = [{event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: roomType, timestamp: aShortTimeAgo},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, roomType: roomType}];

    // When (issued command)
    socrates.issueReservation(roomType, sessionId2);

    // Then (new events)
    expect(stripTimestamps(socrates.resourceEvents)).to.eql([{event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: roomType},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, roomType: roomType}]);
  });

  it('does not count a reservation and its matching booking towards the quota', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    // es werden 1 single bed rooms freigeschaltet
    var roomType = 'singleBedRoom';
    socrates.socratesEvents = [events.roomQuotaWasSet(roomType, 2)];
    socrates.resourceEvents = [{event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: roomType, timestamp: aShortTimeAgo},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, roomType: roomType}];

    // When (issued command)
    socrates.issueReservation(roomType, sessionId2);

    // Then (new events)
    expect(stripTimestamps(socrates.resourceEvents)).to.eql([{event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: roomType},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, roomType: roomType}, {event: RESERVATION_WAS_ISSUED, sessionID: sessionId2, roomType: roomType}]);
  });

  it('registers a room', function () { // TODO books a room?
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    var roomType = 'singleBedRoom';
    socrates.socratesEvents = [events.roomQuotaWasSet(roomType, 100)];
    socrates.resourceEvents = [{event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, timestamp: aShortTimeAgo, roomType: roomType}];

    // When (issued command)
    socrates.registerParticipant(roomType, sessionId1);

    // Then (new events)
    expect(stripTimestamps(socrates.resourceEvents)).to.eql([{event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: roomType},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, roomType: roomType}]);
  });

  it('registers a room even if there was an expired reservation, if there was enough space', function () { // TODO books a room?
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    var roomType = 'singleBedRoom';
    socrates.socratesEvents = [events.roomQuotaWasSet(roomType, 1)];
    socrates.resourceEvents = [{event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, timestamp: aLongTimeAgo, roomType: roomType}];

    // When (issued command)
    socrates.registerParticipant(roomType, sessionId1);

    // Then (new events)
    expect(stripTimestamps(socrates.resourceEvents)).to.eql([{event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: roomType},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, roomType: roomType}]);
  });

  it('does not register a room if there was an expired reservation but if there was not enough space', function () { // TODO books a room?
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    var roomType = 'singleBedRoom';
    socrates.socratesEvents = [events.roomQuotaWasSet(roomType, 1)];
    socrates.resourceEvents = [{event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, timestamp: aLongTimeAgo, roomType: roomType},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId2, roomType: roomType}];

    // When (issued command)
    socrates.registerParticipant(roomType, sessionId1);

    // Then (new events)
    expect(stripTimestamps(socrates.resourceEvents)).to.eql([{event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: roomType},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId2, roomType: roomType}]);
  });

  it('registers a room even if there was no reservation and if there was enough space', function () { // TODO books a room?
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    var roomType = 'singleBedRoom';
    socrates.socratesEvents = [events.roomQuotaWasSet(roomType, 100)];
    socrates.resourceEvents = [];

    // When (issued command)
    socrates.registerParticipant(roomType, sessionId1);

    // Then (new events)
    expect(stripTimestamps(socrates.resourceEvents)).to.eql([{event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, roomType: roomType}]);
  });
});

