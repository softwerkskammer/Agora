'use strict';
var _ = require('lodash');
var R = require('ramda');
var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var events = beans.get('events');

function SoCraTesEventStore() {
  // event streams (will be persisted):
  this.state = {
    socratesEvents: [],
    resourceEvents: []
  };

  // write model state (will not be persisted):
  this._quota = {};
  this._reservationsAndParticipantsBySessionId = {};
  this._participantsByMemberId = undefined;
  return this;
}

// write model state:

var updateQuota = function (roomType, quota, event) { return event.event === 'ROOM-QUOTA-WAS-SET' && event.roomType === roomType ? event.quota : quota; };

SoCraTesEventStore.prototype.quotaFor = function (roomType) {
  if (!this._quota[roomType]) {
    this._quota[roomType] = R.reduce(R.partial(updateQuota, [roomType]), undefined, this.state.socratesEvents);
  }

  return this._quota[roomType];
};

var thirtyMinutesAgo = moment.tz().subtract(30, 'minutes');
var updateBookingsBySessionId = function (roomType, bookingsBySessionId, event) {

  var eventIsForDesiredRoomType = event.roomType === roomType;
  var eventIsRegistration = event.event === 'PARTICIPANT-WAS-REGISTERED';
  var eventIsAnActiveReservation = event.event === 'RESERVATION-WAS-ISSUED' && event.timestamp.isAfter(thirtyMinutesAgo);
  if (eventIsAnActiveReservation && eventIsForDesiredRoomType) {
    bookingsBySessionId[event.sessionID] = event;
  }
  if (eventIsRegistration && eventIsForDesiredRoomType) {
    bookingsBySessionId[event.sessionID] = event;
    // delete bookingsBySessionId[event.sessionID];
  }
  return bookingsBySessionId;
};

SoCraTesEventStore.prototype.reservationsAndParticipants = function (roomType) {
  if (!this._reservationsAndParticipantsBySessionId[roomType]) {
    this._reservationsAndParticipantsBySessionId[roomType] = R.reduce(R.partial(updateBookingsBySessionId, [roomType]), {}, this.state.resourceEvents);
  }
  return R.values(this._reservationsAndParticipantsBySessionId[roomType]);
};

var updateParticipantsByMemberId = function (participantsByMemberId, event) {
  if (event.event === 'PARTICIPANT-WAS-REGISTERED') {
    participantsByMemberId[event.memberId] = event;
  }
  return participantsByMemberId;
};

SoCraTesEventStore.prototype.participantsByMemberId = function () {
  if (!this._participantsByMemberId) {
    this._participantsByMemberId = R.reduce(updateParticipantsByMemberId, {}, this.state.resourceEvents);
  }
  return this._participantsByMemberId;
};

// handle commands:
SoCraTesEventStore.prototype.issueReservation = function (roomType, sessionId) {
  if (this.quotaFor(roomType) > this.reservationsAndParticipants(roomType).length) {
    var event = events.reservationWasIssued(roomType, sessionId);
    // append to event stream:
    this.state.resourceEvents.push(event);
    // update write models:
    this._reservationsAndParticipantsBySessionId[roomType] = updateBookingsBySessionId(roomType, this.reservationsAndParticipants(roomType), event);
    this._participantsByMemberId = updateParticipantsByMemberId(this.participantsByMemberId(), event);
  }
};

SoCraTesEventStore.prototype.registerParticipant = function (roomType, sessionId, memberId) {
  if (this.quotaFor(roomType) > this.reservationsAndParticipants(roomType).length) {
    var event = events.participantWasRegistered(roomType, sessionId, memberId);
    // append to event stream:
    this.state.resourceEvents.push(event);
    // update write models:
    this._reservationsAndParticipantsBySessionId[roomType] = updateBookingsBySessionId(roomType, this.reservationsAndParticipants(roomType), event);
    this._participantsByMemberId = updateParticipantsByMemberId(this.participantsByMemberId(), event);
  }
};

SoCraTesEventStore.prototype.moveParticipantToNewRoomType = function (memberId, roomType) {
  var existingParticipantEvent = this.participantsByMemberId()[memberId];
  var event = existingParticipantEvent ? events.roomTypeWasChanged(memberId, roomType) : events.didNotChangeRoomTypeForNonParticipant(memberId, roomType);
  // append to event stream:
  this.state.resourceEvents.push(event);
  // update write models:
  if(existingParticipantEvent){
    this._reservationsAndParticipantsBySessionId[roomType] = updateBookingsBySessionId(roomType, this.reservationsAndParticipants(roomType), event);
    this._participantsByMemberId = updateParticipantsByMemberId(this.participantsByMemberId(), event);
  }
};

module.exports = SoCraTesEventStore;
