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


var updateReservationsBySessionId = function (roomType, reservationsBySessionId, event) {
  var thirtyMinutesAgo = moment.tz().subtract(30, 'minutes');
  if (event.event === 'RESERVATION-WAS-ISSUED' && event.timestamp.isAfter(thirtyMinutesAgo) && event.roomType === roomType) {
    reservationsBySessionId[event.sessionID] = event;
  }
  if (event.event === 'PARTICIPANT-WAS-REGISTERED' && event.roomType === roomType) {
    delete reservationsBySessionId[event.sessionID];
  }
  return reservationsBySessionId;
};

SoCraTesEventStore.prototype.reservations = function (roomType) {
  if (!this._reservationsBySessionId[roomType]) {
    this._reservationsBySessionId[roomType] = R.reduce(R.partial(updateReservationsBySessionId, [roomType]), {}, this.state.resourceEvents);
  }
  return this._reservationsBySessionId[roomType];
};

var updateParticipantsByMemberId = function (participantsByMemberId, event) {
  if (event.event === 'PARTICIPANT-WAS-REGISTERED' || event.event === 'ROOM-TYPE-WAS-CHANGED') {
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

SoCraTesEventStore.prototype.participantsFor = function (roomType) {
  return R.filter(function(event){ return event.roomType === roomType; }, R.values(this.participantsByMemberId()));
};

SoCraTesEventStore.prototype.reservationsAndParticipantsFor = function (roomType) {
  return R.concat(R.values(this.reservations(roomType)), this.participantsFor(roomType));
};

// handle commands:
SoCraTesEventStore.prototype.updateResourceEventsAndWriteModel = function (event) {
  // append to event stream:
  this.state.resourceEvents.push(event);
  // update write models:
  this._reservationsBySessionId[event.roomType] = updateReservationsBySessionId(event.roomType, this.reservations(event.roomType), event);
  this._participantsByMemberId = updateParticipantsByMemberId(this.participantsByMemberId(), event);
};


SoCraTesEventStore.prototype.issueReservation = function (roomType, sessionId) {
  if (this.quotaFor(roomType) > this.reservationsAndParticipantsFor(roomType).length) {
    var event = events.reservationWasIssued(roomType, sessionId);
    this.updateResourceEventsAndWriteModel(event);
  }
};

SoCraTesEventStore.prototype.registerParticipant = function (roomType, sessionId, memberId) {
  if (this.quotaFor(roomType) > this.reservationsAndParticipantsFor(roomType).length) {
    var event = events.participantWasRegistered(roomType, sessionId, memberId);
    this.updateResourceEventsAndWriteModel(event);
  }
};

SoCraTesEventStore.prototype.moveParticipantToNewRoomType = function (memberId, roomType) {
  var existingParticipantEvent = this.participantsByMemberId()[memberId];
  var event = existingParticipantEvent ? events.roomTypeWasChanged(memberId, roomType) : events.didNotChangeRoomTypeForNonParticipant(memberId, roomType);
  this.updateResourceEventsAndWriteModel(event);
};

module.exports = SoCraTesEventStore;
