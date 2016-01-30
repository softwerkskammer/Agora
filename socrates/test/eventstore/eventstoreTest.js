'use strict';
var expect = require('must-dist');
var moment = require('moment-timezone');
var _ = require('lodash');
var R = require('ramda');

var beans = require('../../testutil/configureForTest').get('beans');
var events = beans.get('events');
var SoCraTesEventStore = require('../../lib/eventstore/eventstore');

var RESERVATION_WAS_ISSUED = 'RESERVATION-WAS-ISSUED';
var PARTICIPANT_WAS_REGISTERED = 'PARTICIPANT-WAS-REGISTERED';
var ROOM_TYPE_WAS_CHANGED = 'ROOM-TYPE-WAS-CHANGED';
var DID_NOT_CHANGE_ROOM_TYPE_FOR_NON_PARTICIPANT = 'DID-NOT-CHANGE-ROOM-TYPE-FOR-NON-PARTICIPANT';

function stripTimestamps(events) {
  return _.map(events, function(event) {
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
    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 100), events.roomQuotaWasSet(singleBedRoom, 200), events.roomQuotaWasSet(bedInDouble, 300)];

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
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, timestamp: aLongTimeAgo}];

    expect(socrates.reservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
  });

  it('considers reservations that are still active', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, timestamp: aShortTimeAgo}];

    expect(socrates.reservationsAndParticipantsFor(singleBedRoom)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, timestamp: aShortTimeAgo}]);
  });

  it('considers participations', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, memberId: memberId1, roomType: singleBedRoom, timestamp: aLongTimeAgo},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId2, memberId: memberId2, roomType: singleBedRoom, timestamp: aShortTimeAgo}];

    expect(socrates.reservationsAndParticipantsFor(singleBedRoom)).to.eql([
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, memberId: memberId1, roomType: singleBedRoom, timestamp: aLongTimeAgo},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId2, memberId: memberId2, roomType: singleBedRoom, timestamp: aShortTimeAgo}]);
  });

  it('does not consider registrations that have a matching participation', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, timestamp: aShortTimeAgo},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, memberId: memberId1, roomType: singleBedRoom, timestamp: anEvenShorterTimeAgo}];

    expect(socrates.reservationsAndParticipantsFor(singleBedRoom)).to.eql([
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, memberId: memberId1, roomType: singleBedRoom, timestamp: anEvenShorterTimeAgo}]);
  });

  it('returns only the events belonging to the queried room type', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: bedInDouble, timestamp: aLongTimeAgo},
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, timestamp: aShortTimeAgo},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId2, memberId: memberId2, roomType: bedInDouble, timestamp: aShortTimeAgo},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, memberId: memberId1, roomType: singleBedRoom, timestamp: anEvenShorterTimeAgo}];

    expect(socrates.reservationsAndParticipantsFor(singleBedRoom)).to.eql([
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, memberId: memberId1, roomType: singleBedRoom, timestamp: anEvenShorterTimeAgo}]);
    expect(socrates.reservationsAndParticipantsFor(bedInDouble)).to.eql([
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId2, memberId: memberId2, roomType: bedInDouble, timestamp: aShortTimeAgo}]);
  });
});

describe('the socrates conference command handler for room reservations', function () {
  it('reserves a room if the quota is not yet exceeded', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();

    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 100)];
    socrates.state.resourceEvents = [];

    // When (issued command)
    socrates.issueReservation(singleBedRoom, sessionId1);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom}]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom}]);
  });

  it('does not reserve a room if the quota is already exhausted by an active reservation', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();

    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 1)];
    socrates.state.resourceEvents = [
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, timestamp: aShortTimeAgo}];

    // When (issued command)
    socrates.issueReservation(singleBedRoom, sessionId2);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom}]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom}]);
  });

  it('reserves a room when an expired reservation exists', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();

    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 1)];
    socrates.state.resourceEvents = [
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, timestamp: aLongTimeAgo}];

    // When (issued command)
    socrates.issueReservation(singleBedRoom, sessionId2);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom},
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId2, roomType: singleBedRoom}]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId2, roomType: singleBedRoom}]);
  });

  it('does not reserve a room if the quota is already exhausted by a registration', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();

    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 1)];
    socrates.state.resourceEvents = [
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, timestamp: aShortTimeAgo},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, roomType: singleBedRoom}];

    // When (issued command)
    socrates.issueReservation(singleBedRoom, sessionId2);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, roomType: singleBedRoom}]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, roomType: singleBedRoom}]);
  });

  it('does not count a reservation and its matching booking towards the quota', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();

    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 2)];
    socrates.state.resourceEvents = [
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, timestamp: aShortTimeAgo},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, memberId: memberId1, roomType: singleBedRoom}];

    // When (issued command)
    socrates.issueReservation(singleBedRoom, sessionId2);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, memberId: memberId1, roomType: singleBedRoom},
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId2, roomType: singleBedRoom}]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId2, roomType: singleBedRoom},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, memberId: memberId1, roomType: singleBedRoom}]);
  });
});

describe('the socrates conference command handler for room bookings', function () {
  it('registers a room', function () { // TODO books a room?
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 100)];
    socrates.state.resourceEvents = [
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, timestamp: aShortTimeAgo, roomType: singleBedRoom}];

    // When (issued command)
    socrates.registerParticipant(singleBedRoom, sessionId1, memberId1);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, roomType: singleBedRoom, memberId: memberId1}]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, roomType: singleBedRoom, memberId: memberId1}]);
  });

  it('registers a room even if there was an expired reservation, if there was enough space', function () { // TODO books a room?
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 1)];
    socrates.state.resourceEvents = [
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, timestamp: aLongTimeAgo, roomType: singleBedRoom}];

    // When (issued command)
    socrates.registerParticipant(singleBedRoom, sessionId1, memberId1);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, roomType: singleBedRoom, memberId: memberId1}]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, roomType: singleBedRoom, memberId: memberId1}]);
  });

  it('does not register a room if there was an expired reservation but if there was not enough space', function () { // TODO books a room?
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 1)];
    socrates.state.resourceEvents = [
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, timestamp: aLongTimeAgo, roomType: singleBedRoom},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId2, roomType: singleBedRoom, memberId: memberId2}];

    // When (issued command)
    socrates.registerParticipant(singleBedRoom, sessionId1, memberId1);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId2, roomType: singleBedRoom, memberId: memberId2}]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId2, roomType: singleBedRoom, memberId: memberId2}]);
  });

  it('registers a room even if there was no reservation, if there was enough space', function () { // TODO books a room?
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 100)];
    socrates.state.resourceEvents = [];

    // When (issued command)
    socrates.registerParticipant(singleBedRoom, sessionId1, memberId1);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, roomType: singleBedRoom, memberId: memberId1}]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, roomType: singleBedRoom, memberId: memberId1}]);
  });
});

describe('the socrates conference command handler for room type changes', function () {
  it('moves the participant to the new room type without caring about the new room limit', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.state.socratesEvents = [events.roomQuotaWasSet(bedInDouble, 0)];
    socrates.state.resourceEvents = [
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom, timestamp: aLongTimeAgo},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, roomType: singleBedRoom, memberId: memberId1, timestamp: aShortTimeAgo}];

    // When (issued command)
    socrates.moveParticipantToNewRoomType(memberId1, bedInDouble);

    // Then (new events)
    expect(stripTimestamps(socrates.state.resourceEvents)).to.eql([
      {event: RESERVATION_WAS_ISSUED, sessionID: sessionId1, roomType: singleBedRoom},
      {event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId1, roomType: singleBedRoom, memberId: memberId1},
      {event: ROOM_TYPE_WAS_CHANGED, memberId: memberId1, roomType: bedInDouble}]);
    // And (new write model)
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(singleBedRoom))).to.eql([]);
    expect(stripTimestamps(socrates.reservationsAndParticipantsFor(bedInDouble))).to.eql([
      {event: ROOM_TYPE_WAS_CHANGED, memberId: memberId1, roomType: bedInDouble}]);
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
