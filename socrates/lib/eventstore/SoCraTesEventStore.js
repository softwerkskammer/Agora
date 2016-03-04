/*eslint no-underscore-dangle: 0*/
'use strict';

var R = require('ramda');
var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var events = beans.get('events');
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
  if (event.event === 'PARTICIPANT-WAS-REGISTERED' || event.event === 'ROOM-TYPE-WAS-CHANGED' || event.event === 'DURATION-WAS-CHANGED') {
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
SoCraTesEventStore.prototype._updateSoCraTesEventsAndWriteModel = function (event) {
  // append to event stream:
  this.state.socratesEvents.push(event);
  // update write models:
  this._quota[event.roomType] = updateQuota(event.roomType, this.quotaFor(event.roomType), event);
};

SoCraTesEventStore.prototype.updateRoomQuota = function (roomType, quota) {
  var event = events.roomQuotaWasSet(roomType, quota);
  this._updateSoCraTesEventsAndWriteModel(event);
};

// that create Resource events:
SoCraTesEventStore.prototype._updateResourceEventsAndWriteModel = function (event) {
  // append to event stream:
  this.state.resourceEvents.push(event);
  // update write models:
  this._reservationsBySessionId = updateReservationsBySessionId(this.reservationsBySessionId(), event);
  this._participantsByMemberId = updateParticipantsByMemberId(this.participantsByMemberId(), event);
};

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
};

SoCraTesEventStore.prototype.registerParticipant = function (roomType, duration, sessionId, memberId) {
  var event;
  if (this.reservationsBySessionId()[sessionId]) {
    // TODO does not work if the SoCraTesEventStore stays in memory for more than 30 minutes! How to test this?
    event = events.participantWasRegistered(roomType, duration, sessionId, memberId);
  } else if (this.isFull(roomType)) {
    event = events.didNotRegisterParticipantForFullResource(roomType, duration, sessionId, memberId);
  } else if (this.isAlreadyRegistered(memberId)) {
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

SoCraTesEventStore.prototype.isFull = function (roomType) {
  return this.quotaFor(roomType) <= this.reservationsAndParticipantsFor(roomType).length;
};

SoCraTesEventStore.prototype._participantEventFor = function (memberId) {
  return this.participantsByMemberId()[memberId];
};

SoCraTesEventStore.prototype.isAlreadyRegistered = function (memberId) {
  return !!this._participantEventFor(memberId);
};

SoCraTesEventStore.prototype.isAlreadyOnWaitinglist = function (memberId) {
  return false; // TODO implement waitinglist!
};

SoCraTesEventStore.prototype.selectedOptionFor = function (memberID) {
  var participantEvent = this._participantEventFor(memberID);
  if (participantEvent) {
    return participantEvent.roomType + ',' + participantEvent.duration;
  }

  /* TODO implement waitinglist!
  var waitResource = _.first(this.waitinglistResourcesFor(memberID));
  if (waitResource) {
    return waitResource.resourceName + ',waitinglist';
  }
  */
  return null;
};


module.exports = SoCraTesEventStore;
