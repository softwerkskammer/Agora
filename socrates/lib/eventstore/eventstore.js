'use strict';
var _ = require('lodash');
var R = require('ramda');
var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var events = beans.get('events');

function SoCraTesEventStore() {
  this.socratesEvents = [];
  this.resourceEvents = [];
  this._quota = {};
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
var updateBookingsBySessionId = function (bookingsBySessionId, event) {
  if (event.event === 'PARTICIPANT-WAS-REGISTERED' || (event.event === 'RESERVATION-WAS-ISSUED' && event.timestamp.isAfter(thirtyMinutesAgo))) {
    bookingsBySessionId[event.sessionID] = event;
  }
  return bookingsBySessionId;
};

SoCraTesEventStore.prototype.reservationsAndParticipants = function () {
  if (!this._reservationsAndParticipants) {
    this._reservationsAndParticipants = R.reduce(updateBookingsBySessionId, {}, this.resourceEvents);
  }
  return R.values(this._reservationsAndParticipants);
};

// handle commands:
SoCraTesEventStore.prototype.issueReservation = function (roomType, sessionId) {
  if (this.quotaFor(roomType) > this.reservationsAndParticipants().length) {
    var event = events.reservationWasIssued(roomType, sessionId);
    // append to event stream:
    this.resourceEvents.push(event);
    // update write model:
    this._reservationsAndParticipants = updateBookingsBySessionId(this._reservationsAndParticipants, event);
  }
};

SoCraTesEventStore.prototype.registerParticipant = function (roomType, sessionId) {
  if (this.quotaFor(roomType) > this.reservationsAndParticipants().length) {
    var event = events.participantWasRegistered(roomType, sessionId);
    // append to event stream:
    this.resourceEvents.push(event);
    // update write model:
    this._reservationsAndParticipants = updateBookingsBySessionId(this._reservationsAndParticipants, event);
  }
};

module.exports = SoCraTesEventStore;
