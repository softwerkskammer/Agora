'use strict';
var _ = require('lodash');
var R = require('ramda');
var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var events = beans.get('events');

function SoCraTesEventStore() {
  // event streams:
  this.socratesEvents = [];
  this.resourceEvents = [];

  // write model state:
  this._quota = {};
  this._reservationsAndParticipants = {};
  return this;
}

// write model state:

var updateQuota = function (roomType, quota, event) { return event.event === 'ROOM-QUOTA-WAS-SET' && event.roomType === roomType ? event.quota : quota; }

SoCraTesEventStore.prototype.quotaFor = function (roomType) {
  if (!this._quota[roomType]) {
    this._quota[roomType] = R.reduce(R.partial(updateQuota, [roomType]), undefined, this.socratesEvents);
  }

  return this._quota[roomType];
};

var thirtyMinutesAgo = moment.tz().subtract(30, 'minutes');
var updateBookingsBySessionId = function (roomType, bookingsBySessionId, event) {

  var eventIsForDesiredRoomType = event.roomType === roomType;
  var eventIsRegistration = event.event === 'PARTICIPANT-WAS-REGISTERED';
  var eventIsAnActiveReservation = event.event === 'RESERVATION-WAS-ISSUED' && event.timestamp.isAfter(thirtyMinutesAgo);
  if ((eventIsRegistration || eventIsAnActiveReservation) && eventIsForDesiredRoomType) {
    bookingsBySessionId[event.sessionID] = event;
  }
  return bookingsBySessionId;
};

SoCraTesEventStore.prototype.reservationsAndParticipants = function (roomType) {
  if (!this._reservationsAndParticipants[roomType]) {
    this._reservationsAndParticipants[roomType] = R.reduce(R.partial(updateBookingsBySessionId, [roomType]), {}, this.resourceEvents);
  }
  return R.values(this._reservationsAndParticipants[roomType]);
};

// handle commands:
SoCraTesEventStore.prototype.issueReservation = function (roomType, sessionId) {
  if (this.quotaFor(roomType) > this.reservationsAndParticipants(roomType).length) {
    var event = events.reservationWasIssued(roomType, sessionId);
    // append to event stream:
    this.resourceEvents.push(event);
    // update write model:
    this._reservationsAndParticipants[roomType] = updateBookingsBySessionId(roomType, this._reservationsAndParticipants[roomType], event);
  }
};

SoCraTesEventStore.prototype.registerParticipant = function (roomType, sessionId) {
  if (this.quotaFor(roomType) > this.reservationsAndParticipants(roomType).length) {
    var event = events.participantWasRegistered(roomType, sessionId);
    // append to event stream:
    this.resourceEvents.push(event);
    // update write model:
    this._reservationsAndParticipants[roomType] = updateBookingsBySessionId(roomType, this._reservationsAndParticipants[roomType], event);
  }
};

module.exports = SoCraTesEventStore;
