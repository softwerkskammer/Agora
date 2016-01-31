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
  this._reservationsBySessionId = undefined;
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

var updateReservationsBySessionId = function (reservationsBySessionId, event) {
  var thirtyMinutesAgo = moment.tz().subtract(30, 'minutes');
  if (event.event === 'RESERVATION-WAS-ISSUED' && event.timestamp.isAfter(thirtyMinutesAgo)) {
    reservationsBySessionId[event.sessionID] = event;
  }
  if (event.event === 'PARTICIPANT-WAS-REGISTERED') {
    delete reservationsBySessionId[event.sessionID];
  }
  return reservationsBySessionId;
};

SoCraTesEventStore.prototype.reservationsBySessionId = function () {
  if (!this._reservationsBySessionId) {
    this._reservationsBySessionId = R.reduce(updateReservationsBySessionId, {}, this.state.resourceEvents);
  }
  return this._reservationsBySessionId;
};

SoCraTesEventStore.prototype.reservationsBySessionIdFor = function (roomType) {
  return R.filter(function (event) { return event.roomType === roomType; }, this.reservationsBySessionId());
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

SoCraTesEventStore.prototype.participantsByMemberIdFor = function (roomType) {
  return R.filter(function (event) { return event.roomType === roomType; }, this.participantsByMemberId());
};

SoCraTesEventStore.prototype.reservationsAndParticipantsFor = function (roomType) {
  return R.concat(R.values(this.reservationsBySessionIdFor(roomType)), R.values(this.participantsByMemberIdFor(roomType)));
};

// handle commands:
// that create SoCraTes events:
SoCraTesEventStore.prototype.updateSoCraTesEventsAndWriteModel = function (event) {
  // append to event stream:
  this.state.socratesEvents.push(event);
  // update write models:
  this._quota[event.roomType] = updateQuota(event.roomType, this.quotaFor(event.roomType), event);
};

SoCraTesEventStore.prototype.updateRoomQuota = function (roomType, quota) {
  var event = events.roomQuotaWasSet(roomType, quota);
  this.updateSoCraTesEventsAndWriteModel(event);
};

// that create Resource events:
SoCraTesEventStore.prototype.updateResourceEventsAndWriteModel = function (event) {
  // append to event stream:
  this.state.resourceEvents.push(event);
  // update write models:
  this._reservationsBySessionId = updateReservationsBySessionId(this.reservationsBySessionId(), event);
  this._participantsByMemberId = updateParticipantsByMemberId(this.participantsByMemberId(), event);
};

SoCraTesEventStore.prototype.issueReservation = function (roomType, sessionId) {
  var event;
  if (this.quotaFor(roomType) <= this.reservationsAndParticipantsFor(roomType).length) {
    // resource is already full
    event = events.didNotIssueReservationForFullResource(roomType, sessionId);
  } else if (this.reservationsBySessionId()[sessionId]) {
    // session id already reserved a spot
    event = events.didNotIssueReservationForAlreadyReservedSession(roomType, sessionId);
  } else {
    // all is good
    event = events.reservationWasIssued(roomType, sessionId);
  }
  this.updateResourceEventsAndWriteModel(event);
};

SoCraTesEventStore.prototype.registerParticipant = function (roomType, sessionId, memberId) {
  var event;
  if (this.quotaFor(roomType) <= this.reservationsAndParticipantsFor(roomType).length) {
    // resource is already full
    event = events.didNotRegisterParticipantForFullResource(roomType, sessionId, memberId);
  } else if (this.participantsByMemberId()[memberId]) {
    // member is already registered
    event = events.didNotRegisterParticipantASecondTime(roomType, sessionId, memberId);
  } else {
    // all is well
    event = events.participantWasRegistered(roomType, sessionId, memberId);
  }
  this.updateResourceEventsAndWriteModel(event);
};

SoCraTesEventStore.prototype.moveParticipantToNewRoomType = function (memberId, roomType) {
  var existingParticipantEvent = this.participantsByMemberId()[memberId];
  var event = existingParticipantEvent ? events.roomTypeWasChanged(memberId, roomType) : events.didNotChangeRoomTypeForNonParticipant(memberId, roomType);
  this.updateResourceEventsAndWriteModel(event);
};

module.exports = SoCraTesEventStore;
