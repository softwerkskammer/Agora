/*eslint no-underscore-dangle: 0*/
'use strict';

var R = require('ramda');
var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var events = beans.get('events');
var e = beans.get('eventConstants');
var socratesConstants = beans.get('socratesConstants');

function SoCraTesEventStore(object) {
  // TODO when loading from DB, sort event streams by timestamp!
  // event streams (will be persisted):
  this.state = object || {
      url: socratesConstants.currentUrl,
      socratesEvents: [],
      resourceEvents: []
    };

  // write model state (will not be persisted):
  this._quota = {};
  this._reservationsBySessionId = undefined;
  this._waitinglistReservationsBySessionId = undefined;
  this._participantsByMemberId = undefined;
  this._waitinglistParticipantsByMemberId = undefined;
  return this;
}

var registrationPeriodinMinutes = 30;

// write model state:
////////////////////////////////////////////////////////////////////////////////////////////
// General Event Information:
////////////////////////////////////////////////////////////////////////////////////////////

SoCraTesEventStore.prototype.updateRoomQuota = function (roomType, quota) {
  var event = events.roomQuotaWasSet(roomType, quota);
  this._updateSoCraTesEventsAndWriteModel(event);
};

var updateQuota = function (roomType, quota, event) { return event.event === e.ROOM_QUOTA_WAS_SET && event.roomType === roomType ? event.quota : quota; };

SoCraTesEventStore.prototype.quotaFor = function (roomType) {
  if (!this._quota[roomType]) {
    this._quota[roomType] = R.reduce(R.partial(updateQuota, [roomType]), undefined, this.state.socratesEvents);
  }

  return this._quota[roomType];
};

var updateReservationsBySessionId = function (reservationsBySessionId, event) {
  var thirtyMinutesAgo = moment.tz().subtract(registrationPeriodinMinutes, 'minutes');
  if (event.event === e.RESERVATION_WAS_ISSUED && event.timestamp.isAfter(thirtyMinutesAgo)) {
    reservationsBySessionId[event.sessionID] = event;
  }
  if (event.event === e.PARTICIPANT_WAS_REGISTERED) {
    delete reservationsBySessionId[event.sessionID];
  }
  return reservationsBySessionId;
};

// handle commands:
// that create SoCraTes events:
SoCraTesEventStore.prototype._updateSoCraTesEventsAndWriteModel = function (event) {
  // append to event stream:
  this.state.socratesEvents.push(event);
  // update write models:
  this._quota[event.roomType] = updateQuota(event.roomType, this.quotaFor(event.roomType), event);
};

////////////////////////////////////////////////////////////////////////////////////////////
// Reservations and Participants:
////////////////////////////////////////////////////////////////////////////////////////////

SoCraTesEventStore.prototype.issueReservation = function (roomType, duration, sessionId) {
  var event;
  if (this.isFull(roomType)) {
    event = events.didNotIssueReservationForFullResource(roomType, duration, sessionId);
  } else if (this.reservationsBySessionId()[sessionId]) {
    // session id already reserved a spot
    event = events.didNotIssueReservationForAlreadyReservedSession(roomType, duration, sessionId);
  } else {
    // all is good
    event = events.reservationWasIssued(roomType, duration, sessionId);
  }
  this._updateResourceEventsAndWriteModel(event);
  return event.event;
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
  if (event.event === e.PARTICIPANT_WAS_REGISTERED || event.event === e.ROOM_TYPE_WAS_CHANGED || event.event === e.DURATION_WAS_CHANGED) {
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
// that create Resource events:
SoCraTesEventStore.prototype.registerParticipant = function (roomType, duration, sessionId, memberId) {
  var event;
  if (this.reservationsBySessionId()[sessionId]) {
    // TODO does not work if the SoCraTesEventStore stays in memory for more than 30 minutes! How to test this?
    event = events.participantWasRegistered(roomType, duration, sessionId, memberId);
  } else if (this.isFull(roomType)) {
    event = events.didNotRegisterParticipantForFullResource(roomType, duration, sessionId, memberId);
  } else if (this.isAlreadyRegistered(memberId) || this.isAlreadyOnWaitinglist(memberId)) {
    event = events.didNotRegisterParticipantASecondTime(roomType, duration, sessionId, memberId);
  } else {
    // all is well
    event = events.participantWasRegistered(roomType, duration, sessionId, memberId);
  }
  this._updateResourceEventsAndWriteModel(event);
};

SoCraTesEventStore.prototype.moveParticipantToNewRoomType = function (memberId, roomType) {
  var existingParticipantEvent = this._participantEventFor(memberId);
  var event = existingParticipantEvent ? events.roomTypeWasChanged(memberId, roomType, existingParticipantEvent.duration) : events.didNotChangeRoomTypeForNonParticipant(memberId, roomType);
  this._updateResourceEventsAndWriteModel(event);
};

SoCraTesEventStore.prototype.setNewDurationForParticipant = function (memberId, duration) {
  var existingParticipantEvent = this._participantEventFor(memberId);
  var event = existingParticipantEvent ? events.durationWasChanged(memberId, existingParticipantEvent.roomType, duration) : events.didNotChangeDurationForNonParticipant(memberId, duration);
  this._updateResourceEventsAndWriteModel(event);
};

SoCraTesEventStore.prototype._participantEventFor = function (memberId) {
  return this.participantsByMemberId()[memberId];
};

SoCraTesEventStore.prototype.isAlreadyRegistered = function (memberId) {
  return !!this._participantEventFor(memberId);
};

////////////////////////////////////////////////////////////////////////////////////////////
// Waitinglist Reservations and Participants
////////////////////////////////////////////////////////////////////////////////////////////

SoCraTesEventStore.prototype.issueWaitinglistReservation = function (roomType, sessionId) {
  var event;
  if (this.waitinglistReservationsBySessionId()[sessionId]) {
    // session id already reserved a spot
    event = events.didNotIssueWaitinglistReservationForAlreadyReservedSession(roomType, sessionId);
  } else {
    // all is good
    event = events.waitinglistReservationWasIssued(roomType, sessionId);
  }
  this._updateResourceEventsAndWriteModel(event);
  return event.event;
};

SoCraTesEventStore.prototype.registerWaitinglistParticipant = function (roomType, sessionId, memberId) {
  var event;
  if (this.waitinglistReservationsBySessionId()[sessionId]) {
    // TODO does not work if the SoCraTesEventStore stays in memory for more than 30 minutes! How to test this?
    event = events.waitinglistParticipantWasRegistered(roomType, sessionId, memberId);
  } else if (this.isAlreadyRegistered(memberId) || this.isAlreadyOnWaitinglist(memberId)) {
    event = events.didNotRegisterParticipantASecondTime(roomType, 'waitinglist', sessionId, memberId);
  } else {
    // all is well
    event = events.waitinglistParticipantWasRegistered(roomType, sessionId, memberId);
  }
  this._updateResourceEventsAndWriteModel(event);
};

var updateWaitinglistReservationsBySessionId = function (waitinglistReservationsBySessionId, event) {
  var thirtyMinutesAgo = moment.tz().subtract(30, 'minutes');
  if (event.event === e.WAITINGLIST_RESERVATION_WAS_ISSUED && event.timestamp.isAfter(thirtyMinutesAgo)) {
    waitinglistReservationsBySessionId[event.sessionID] = event;
  }
  if (event.event === e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED) {
    delete waitinglistReservationsBySessionId[event.sessionID];
  }
  return waitinglistReservationsBySessionId;
};

SoCraTesEventStore.prototype.waitinglistReservationsBySessionId = function () {
  if (!this._waitinglistReservationsBySessionId) {
    this._waitinglistReservationsBySessionId = R.reduce(updateWaitinglistReservationsBySessionId, {}, this.state.resourceEvents);
  }
  return this._waitinglistReservationsBySessionId;
};

SoCraTesEventStore.prototype.waitinglistReservationsBySessionIdFor = function (roomType) {
  return R.filter(function (event) { return R.contains(roomType, event.desiredRoomTypes); }, this.waitinglistReservationsBySessionId());
};

var updateWaitinglistParticipantsByMemberId = function (waitinglistParticipantsByMemberId, event) {
  if (event.event === e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED) {
    waitinglistParticipantsByMemberId[event.memberId] = event;
  }
  return waitinglistParticipantsByMemberId;
};

SoCraTesEventStore.prototype.waitinglistParticipantsByMemberId = function () {
  if (!this._waitinglistParticipantsByMemberId) {
    this._waitinglistParticipantsByMemberId = R.reduce(updateWaitinglistParticipantsByMemberId, {}, this.state.resourceEvents);
  }
  return this._waitinglistParticipantsByMemberId;
};

SoCraTesEventStore.prototype.waitinglistParticipantsByMemberIdFor = function (roomType) {
  return R.filter(function (event) { return R.contains(roomType, event.desiredRoomTypes); }, this.waitinglistParticipantsByMemberId());
};


// TODO this is currently for tests only...:
SoCraTesEventStore.prototype.waitinglistReservationsAndParticipantsFor = function (roomType) {
  return R.concat(R.values(this.waitinglistReservationsBySessionIdFor(roomType)), R.values(this.waitinglistParticipantsByMemberIdFor(roomType)));
};

SoCraTesEventStore.prototype._waitinglistParticipantEventFor = function (memberId) {
  return this.waitinglistParticipantsByMemberId()[memberId];
};

SoCraTesEventStore.prototype.isAlreadyOnWaitinglist = function (memberId) {
  return !!this._waitinglistParticipantEventFor(memberId);
};

////////////////////////////////////////////////////////////////////////////////////////////
// General
////////////////////////////////////////////////////////////////////////////////////////////

SoCraTesEventStore.prototype._updateResourceEventsAndWriteModel = function (event) {
  // append to event stream:
  this.state.resourceEvents.push(event);
  // update write models:
  this._reservationsBySessionId = updateReservationsBySessionId(this.reservationsBySessionId(), event);
  this._participantsByMemberId = updateParticipantsByMemberId(this.participantsByMemberId(), event);
  this._waitinglistReservationsBySessionId = updateWaitinglistReservationsBySessionId(this.waitinglistReservationsBySessionId(), event);
  this._waitinglistParticipantsByMemberId = updateWaitinglistParticipantsByMemberId(this.waitinglistParticipantsByMemberId(), event);
};

function expirationTimeOf(event) {
  return event.timestamp.add(registrationPeriodinMinutes, 'minutes');
}

SoCraTesEventStore.prototype._reservationOrWaitinglistReservationEventFor = function (sessionId) {
  return this.reservationsBySessionId()[sessionId] || this.waitinglistReservationsBySessionId()[sessionId];
};

SoCraTesEventStore.prototype.hasValidReservationFor = function (sessionId) {
  return !!this._reservationOrWaitinglistReservationEventFor(sessionId);
};

SoCraTesEventStore.prototype.reservationExpiration = function (sessionId) {
  var event = this._reservationOrWaitinglistReservationEventFor(sessionId);
  return event && expirationTimeOf(event);
};

SoCraTesEventStore.prototype.isFull = function (roomType) {
  return this.quotaFor(roomType) <= this.reservationsAndParticipantsFor(roomType).length;
};

SoCraTesEventStore.prototype.selectedOptionFor = function (memberID) {
  var participantEvent = this._participantEventFor(memberID);
  if (participantEvent) {
    return participantEvent.roomType + ',' + participantEvent.duration;
  }

  var waitinglistParticipantEvent = this._waitinglistParticipantEventFor(memberID);
  if (waitinglistParticipantEvent) {
    return waitinglistParticipantEvent.desiredRoomTypes[0] + ',waitinglist'; // TODO improve UX! Show all selected waitinglist options.
  }
  return null;
};


module.exports = SoCraTesEventStore;
