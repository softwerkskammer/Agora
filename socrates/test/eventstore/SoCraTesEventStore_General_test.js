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
  event.timestamp = timestamp.valueOf();
  return event;
}

describe('The socrates conference command handlers for the event time', function () {

  it('reads the latest start and end time from the events', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();

    socrates.state.socratesEvents = [
      events.startTimeWasSet(moment('2015-12-15T12:30:00+02:00')),
      events.startTimeWasSet(moment('2015-06-15T12:30:00+02:00')),
      events.endTimeWasSet(moment('2015-11-15T12:30:00+02:00')),
      events.endTimeWasSet(moment('2015-08-15T12:30:00+02:00'))
    ];

    // Then (new write model)
    expect(socrates.startTime().valueOf()).to.eql(moment('2015-06-15T12:30:00+02:00').valueOf());
    expect(socrates.endTime().valueOf()).to.eql(moment('2015-08-15T12:30:00+02:00').valueOf());
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

    expect(socrates.reservationExpiration(sessionId1).valueOf()).to.be(aShortTimeAgo.add(30, 'minutes').valueOf());
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

    expect(socrates.reservationExpiration(sessionId1).valueOf()).to.be(aShortTimeAgo.add(30, 'minutes').valueOf());
  });

  it('returns the expiration time of the reservation if there are both regular and waitinglist reservations', function () {
    var socrates = new SoCraTesEventStore();
    socrates.state.resourceEvents = [
      setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aShortTimeAgo),
      setTimestamp(events.waitinglistReservationWasIssued(singleBedRoom, sessionId1), anEvenShorterTimeAgo)
    ];

    expect(socrates.reservationExpiration(sessionId1).valueOf()).to.be(aShortTimeAgo.add(30, 'minutes').valueOf());

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
