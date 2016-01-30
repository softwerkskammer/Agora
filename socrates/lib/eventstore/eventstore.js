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
SoCraTesEventStore.prototype.quota = function () {
  if (!this._quota) {
    var f = function (quota, event) { return event.event === 'ROOM-QUOTA-WAS-SET' ? event.quota : quota; }
    this._quota = R.reduce(f, undefined, this.socratesEvents);
  }

  return this._quota;
};

SoCraTesEventStore.prototype.reservationsAndParticipants = function () {
  var self = this;
  var thirtyMinutesAgo = moment.tz().subtract(30, 'minutes');
  if(!self._reservationsAndParticipants) {
    var events = _.filter(this.resourceEvents, function (event) {
      return event.event === 'PARTICIPANT-WAS-REGISTERED' || (event.event === 'RESERVATION-WAS-ISSUED' && event.timestamp.isAfter(thirtyMinutesAgo));
    });
    var f = function (eventsBySessionId, event) { eventsBySessionId[event.sessionID] = event; return eventsBySessionId; }
    self._reservationsAndParticipants = R.reduce(f, {}, events);
  }
  return R.values(self._reservationsAndParticipants);
};

// handle commands:
SoCraTesEventStore.prototype.issueReservation = function (roomType, sessionId) {
  if(this.quota() > this.reservationsAndParticipants().length) {
    var event = events.reservationWasIssued(roomType, sessionId);
    this.resourceEvents.push(event);
    this._reservationsAndParticipants[event.sessionID] = event;
  }
};

SoCraTesEventStore.prototype.registerParticipant = function (roomType, sessionId) {
  if(this.quota() > this.reservationsAndParticipants().length) {
    var event = events.participantWasRegistered(roomType, sessionId);
    this.resourceEvents.push(event);
    this._reservationsAndParticipants[event.sessionID] = event;
  }
};

module.exports = SoCraTesEventStore;
