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
  this._reservationsBySessionId = {};
  this._participantsInAllRoomTypesByMemberId = undefined;
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
    delete bookingsBySessionId[event.sessionID];
  }
  return bookingsBySessionId;
};

SoCraTesEventStore.prototype.reservations = function (roomType) {
  if (!this._reservationsBySessionId[roomType]) {
    this._reservationsBySessionId[roomType] = R.reduce(R.partial(updateBookingsBySessionId, [roomType]), {}, this.state.resourceEvents);
  }
  return R.values(this._reservationsBySessionId[roomType]);
};

var updateParticipantsInAllRoomTypesByMemberId = function (participantsInAllRoomTypesByMemberId, event) {
  if (event.event === 'PARTICIPANT-WAS-REGISTERED') {
    participantsInAllRoomTypesByMemberId[event.memberId] = event;
  }
  return participantsInAllRoomTypesByMemberId;
};

SoCraTesEventStore.prototype.participantsInAllRoomTypesByMemberId = function () {
  if (!this._participantsInAllRoomTypesByMemberId) {
    this._participantsInAllRoomTypesByMemberId = R.reduce(updateParticipantsInAllRoomTypesByMemberId, {}, this.state.resourceEvents);
  }
  return this._participantsInAllRoomTypesByMemberId;
};

SoCraTesEventStore.prototype.reservationsAndParticipants = function (roomType) {
  this.reservations(roomType); // hydrate cache - TODO remove
  return R.values(R.reduce(function (result, event) { if(event.roomType === roomType) { result[event.sessionID] = event; } return result; },
    this._reservationsBySessionId[roomType] || {},
    R.values(this.participantsInAllRoomTypesByMemberId())));
}

// handle commands:
SoCraTesEventStore.prototype.issueReservation = function (roomType, sessionId) {
  if (this.quotaFor(roomType) > this.reservationsAndParticipants(roomType).length) {
    var event = events.reservationWasIssued(roomType, sessionId);
    // append to event stream:
    this.state.resourceEvents.push(event);
    // update write models:
    this._reservationsBySessionId[roomType] = updateBookingsBySessionId(roomType, this.reservations(roomType), event);
    this._participantsInAllRoomTypesByMemberId = updateParticipantsInAllRoomTypesByMemberId(this.participantsInAllRoomTypesByMemberId(), event);
  }
};

SoCraTesEventStore.prototype.registerParticipant = function (roomType, sessionId, memberId) {
  if (this.quotaFor(roomType) > this.reservationsAndParticipants(roomType).length) {
    var event = events.participantWasRegistered(roomType, sessionId, memberId);
    // append to event stream:
    this.state.resourceEvents.push(event);
    // update write models:
    this._reservationsBySessionId[roomType] = updateBookingsBySessionId(roomType, this.reservations(roomType), event);
    this._participantsInAllRoomTypesByMemberId = updateParticipantsInAllRoomTypesByMemberId(this.participantsInAllRoomTypesByMemberId(), event);
  }
};

SoCraTesEventStore.prototype.moveParticipantToNewRoomType = function (memberId, roomType) {
  var existingParticipantEvent = this.participantsInAllRoomTypesByMemberId()[memberId];
  var event = existingParticipantEvent ? events.roomTypeWasChanged(memberId, roomType) : events.didNotChangeRoomTypeForNonParticipant(memberId, roomType);
  // append to event stream:
  this.state.resourceEvents.push(event);
  // update write models:
  if (existingParticipantEvent) {
    this._reservationsBySessionId[roomType] = updateBookingsBySessionId(roomType, this.reservations(roomType), event);
    this._participantsInAllRoomTypesByMemberId = updateParticipantsInAllRoomTypesByMemberId(this.participantsInAllRoomTypesByMemberId(), event);
  }
};

module.exports = SoCraTesEventStore;
