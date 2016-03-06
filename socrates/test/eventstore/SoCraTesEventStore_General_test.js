'use strict';

var expect = require('must-dist');
var _ = require('lodash');
var R = require('ramda');
var moment = require('moment-timezone');

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

var singleBedRoom = 'singleBedRoom';
var bedInDouble = 'bedInDouble';
var sessionId1 = 'session-id-1';
var sessionId2 = 'session-id-2';

var aLongTimeAgo = moment.tz().subtract(40, 'minutes');
var aShortTimeAgo = moment.tz().subtract(10, 'minutes');
var anEvenShorterTimeAgo = moment.tz().subtract(1, 'minutes');

function setTimestamp(event, timestamp) {
  event.timestamp = timestamp;
  return event;
}

describe('The socrates conference command handler for room quota changes', function () {
  it('changes the quota', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();

    socrates.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 100)];
    socrates.state.resourceEvents = [];

    // When (issued command)
    socrates.updateRoomQuota(singleBedRoom, 150);

    // Then (new events)
    expect(stripTimestamps(socrates.state.socratesEvents)).to.eql([
      {event: e.ROOM_QUOTA_WAS_SET, roomType: singleBedRoom, quota: 100},
      {event: e.ROOM_QUOTA_WAS_SET, roomType: singleBedRoom, quota: 150}
    ]);
    // And (new write model)
    expect(socrates.quotaFor(singleBedRoom)).to.eql(150);
  });
});

describe('The socrates conference write model for the room quota', function () {
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
});

describe('The socrates conference write model calculating the reservationExpiration', function () {
  it('returns undefined as the expiration time if there are no reservations for the given session id', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aShortTimeAgo)
    ];

    expect(socrates.reservationExpiration(sessionId2)).to.be(undefined);
  });

  it('returns the expiration time of the reservation if there is one', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aShortTimeAgo)
    ];

    expect(socrates.reservationExpiration(sessionId1)).to.be(aShortTimeAgo.add(30, 'minutes'));
  });

  it('returns undefined as the expiration time of the reservation if it is already expired', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aLongTimeAgo)
    ];

    expect(socrates.reservationExpiration(sessionId1)).to.be(undefined);
  });

  it('returns the expiration time of the waitinglist reservation if there is no regular reservation', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      setTimestamp(events.waitinglistReservationWasIssued(singleBedRoom, sessionId1), aShortTimeAgo)
    ];

    expect(socrates.reservationExpiration(sessionId1)).to.be(aShortTimeAgo.add(30, 'minutes'));
  });

  it('returns the expiration time of the reservation if there are both regular and waitinglist reservations', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aShortTimeAgo),
      setTimestamp(events.waitinglistReservationWasIssued(singleBedRoom, sessionId1), anEvenShorterTimeAgo)
    ];

    expect(socrates.reservationExpiration(sessionId1)).to.be(aShortTimeAgo.add(30, 'minutes'));

  });
});

describe('The socrates conference write model calculating the existence of a valid reservation', function () {
  it('returns undefined as the expiration time if there are no reservations for the given session id', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aShortTimeAgo)
    ];

    expect(socrates.hasValidReservationFor(sessionId2)).to.be(false);
  });

  it('returns the expiration time of the reservation if there is one', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aShortTimeAgo)
    ];

    expect(socrates.hasValidReservationFor(sessionId1)).to.be(true);
  });

  it('returns undefined as the expiration time of the reservation if it is already expired', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aLongTimeAgo)
    ];

    expect(socrates.hasValidReservationFor(sessionId1)).to.be(false);
  });

  it('returns the expiration time of the waitinglist reservation if there is no regular reservation', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      setTimestamp(events.waitinglistReservationWasIssued(singleBedRoom, sessionId1), aShortTimeAgo)
    ];

    expect(socrates.hasValidReservationFor(sessionId1)).to.be(true);
  });

  it('returns the expiration time of the reservation if there are both regular and waitinglist reservations', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aShortTimeAgo),
      setTimestamp(events.waitinglistReservationWasIssued(singleBedRoom, sessionId1), anEvenShorterTimeAgo)
    ];

    expect(socrates.hasValidReservationFor(sessionId1)).to.be(true);

  });
});
