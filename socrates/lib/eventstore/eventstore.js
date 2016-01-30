'use strict';
var _ = require('lodash');
var R = require('ramda');
var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var events = beans.get('events');

function SoCraTesEventStore() {
  this.socratesEvents = [];
  this.resourceEvents = [];
  return this;
}

// write model state:

var updateQuota = function (quota, event) { return event.event === 'ROOM-QUOTA-WAS-SET' ? event.quota : quota; }

SoCraTesEventStore.prototype.quota = function () {
  if (!this._quota) {
    this._quota = R.reduce(updateQuota, undefined, this.socratesEvents);
  }

  return this._quota;
};

var thirtyMinutesAgo = moment.tz().subtract(30, 'minutes');
var updateEventsBySessionId = function (eventsBySessionId, event) {
  if (event.event === 'PARTICIPANT-WAS-REGISTERED' || (event.event === 'RESERVATION-WAS-ISSUED' && event.timestamp.isAfter(thirtyMinutesAgo))) {
    eventsBySessionId[event.sessionID] = event;
  }
  return eventsBySessionId;
};

SoCraTesEventStore.prototype.reservationsAndParticipants = function () {
  if (!this._reservationsAndParticipants) {
    this._reservationsAndParticipants = R.reduce(updateEventsBySessionId, {}, this.resourceEvents);
  }
  return R.values(this._reservationsAndParticipants);
};

// handle commands:
SoCraTesEventStore.prototype.issueReservation = function (roomType, sessionId) {
  if (this.quota() > this.reservationsAndParticipants().length) {
    var event = events.reservationWasIssued(roomType, sessionId);
    // append to event stream:
    this.resourceEvents.push(event);
    // update write model:
    this._reservationsAndParticipants = updateEventsBySessionId(this._reservationsAndParticipants, event);
  }
};

SoCraTesEventStore.prototype.registerParticipant = function (roomType, sessionId) {
  if (this.quota() > this.reservationsAndParticipants().length) {
    var event = events.participantWasRegistered(roomType, sessionId);
    // append to event stream:
    this.resourceEvents.push(event);
    // update write model:
    this._reservationsAndParticipants = updateEventsBySessionId(this._reservationsAndParticipants, event);
  }
};

module.exports = SoCraTesEventStore;
