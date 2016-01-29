'use strict';
var expect = require('must-dist');
var moment = require('moment-timezone');

var SoCraTesEventStore = require('../../lib/eventstore/eventstore');

var ROOM_QUOTA_WAS_SET = 'ROOM-QUOTA-WAS-SET';
var RESERVATION_WAS_ISSUED = 'RESERVATION-WAS-ISSUED';
var PARTICIPANT_WAS_REGISTERED = 'PARTICIPANT-WAS-REGISTERED';

describe('the socrates conference', function () {
  it('reserves a room if the quota is not yet exceeded', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    // es werden 100 single bed rooms freigeschaltet
    socrates.socratesEvents = [{event: ROOM_QUOTA_WAS_SET, roomType: 'singleBedRoom', contingency: 100}];
    socrates.resourceEvents = [];

    // When (issued command)
    socrates.issueReservation();

    // Then (new events)
    expect(socrates.resourceEvents).to.eql([{event: RESERVATION_WAS_ISSUED}]);
  });

  it('does not reserve a room if the quota is already exhausted by an active reservation', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    // es werden 1 single bed rooms freigeschaltet
    socrates.socratesEvents = [{event: ROOM_QUOTA_WAS_SET, roomType: 'singleBedRoom', contingency: 1}];
    socrates.resourceEvents = [{event: RESERVATION_WAS_ISSUED}];

    // When (issued command)
    socrates.issueReservation();

    // Then (new events)
    expect(socrates.resourceEvents).to.eql([{event: RESERVATION_WAS_ISSUED}]);
  });

  it('reserves a room although an expired reservation exists', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    // es werden 1 single bed rooms freigeschaltet
    socrates.socratesEvents = [{event: ROOM_QUOTA_WAS_SET, roomType: 'singleBedRoom', contingency: 1}];
    socrates.resourceEvents = [{event: RESERVATION_WAS_ISSUED, timestamp: moment.tz()}];

    // When (issued command)
    socrates.issueReservation();

    // Then (new events)
    expect(socrates.resourceEvents).to.eql([{event: RESERVATION_WAS_ISSUED}, {event: RESERVATION_WAS_ISSUED}]);
  });

  it('does not reserve a room if the quota is already exhausted by a registration', function () {
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    // es werden 1 single bed rooms freigeschaltet
    socrates.socratesEvents = [{event: ROOM_QUOTA_WAS_SET, roomType: 'singleBedRoom', contingency: 1}];
    socrates.resourceEvents = [{event: RESERVATION_WAS_ISSUED}, {event: PARTICIPANT_WAS_REGISTERED}];

    // When (issued command)
    socrates.issueReservation();

    // Then (new events)
    expect(socrates.resourceEvents).to.eql([{event: RESERVATION_WAS_ISSUED}, {event: PARTICIPANT_WAS_REGISTERED}]);
  });

  it('registers a room', function () { // TODO books a room?
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.socratesEvents = [{event: ROOM_QUOTA_WAS_SET, roomType: 'singleBedRoom', contingency: 100}];
    socrates.resourceEvents = [{event: RESERVATION_WAS_ISSUED}];

    // When (issued command)
    socrates.registerParticipant();

    // Then (new events)
    expect(socrates.resourceEvents).to.eql([{event: RESERVATION_WAS_ISSUED}, {event: PARTICIPANT_WAS_REGISTERED}]);
  });

  it('registers a room even if there was no reservation and if there was enough space', function () { // TODO books a room?
    // Given (saved events)
    var socrates = new SoCraTesEventStore();
    socrates.socratesEvents = [{event: ROOM_QUOTA_WAS_SET, roomType: 'singleBedRoom', contingency: 100}];
    socrates.resourceEvents = [];

    // When (issued command)
    socrates.registerParticipant();

    // Then (new events)
    expect(socrates.resourceEvents).to.eql([{event: PARTICIPANT_WAS_REGISTERED}]);
  });
});

