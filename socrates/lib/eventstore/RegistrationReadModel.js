/*eslint no-underscore-dangle: 0*/
'use strict';

var R = require('ramda');
var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var e = beans.get('eventConstants');
var socratesConstants = beans.get('socratesConstants');
var SoCraTesReadModel = beans.get('SoCraTesReadModel');
var roomOptions = beans.get('roomOptions');

function RegistrationReadModel(eventStore) {
  this._eventStore = eventStore;

  // read model state:
  this._reservationsBySessionId = undefined;
  this._waitinglistReservationsBySessionId = undefined;
  this._participantsByMemberId = undefined;
  this._waitinglistParticipantsByMemberId = undefined;
}

var projectReservationsBySessionId = function (reservationsBySessionId, event) {
  var earliestValidRegistrationTime = moment.tz().subtract(socratesConstants.registrationPeriodinMinutes, 'minutes');
  if (event.event === e.RESERVATION_WAS_ISSUED && moment(event.timestamp).isAfter(earliestValidRegistrationTime)) {
    reservationsBySessionId[event.sessionID] = event;
  }
  if (event.event === e.PARTICIPANT_WAS_REGISTERED) {
    delete reservationsBySessionId[event.sessionID];
  }
  return reservationsBySessionId;
};

RegistrationReadModel.prototype.reservationsBySessionId = function () {
  if (!this._reservationsBySessionId) {
    this._reservationsBySessionId = R.reduce(projectReservationsBySessionId, {}, this._eventStore.registrationEvents());
  }
  return this._reservationsBySessionId;
};

RegistrationReadModel.prototype.reservationsBySessionIdFor = function (roomType) {
  return R.filter(function (event) { return event.roomType === roomType; }, this.reservationsBySessionId());
};

var projectParticipantsByMemberId = function (participantsByMemberId, event) {
  if (event.event === e.PARTICIPANT_WAS_REGISTERED
    || event.event === e.ROOM_TYPE_WAS_CHANGED
    || event.event === e.DURATION_WAS_CHANGED
    || event.event === e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST) {
    participantsByMemberId[event.memberId] = event;
  }
  if (event.event === e.PARTICIPANT_WAS_REMOVED) {
    delete participantsByMemberId[event.memberId];
  }
  return participantsByMemberId;
};

RegistrationReadModel.prototype.participantsByMemberId = function () {
  if (!this._participantsByMemberId) {
    this._participantsByMemberId = R.reduce(projectParticipantsByMemberId, {}, this._eventStore.registrationEvents());
  }
  return this._participantsByMemberId;
};

RegistrationReadModel.prototype.participantsByMemberIdFor = function (roomType) {
  return R.filter(function (event) { return event.roomType === roomType; }, this.participantsByMemberId());
};

RegistrationReadModel.prototype.participantCountFor = function (roomType) {
  return this.allParticipantsIn(roomType).length;
};

RegistrationReadModel.prototype.participantEventFor = function (memberId) {
  return this.participantsByMemberId()[memberId];
};

// TODO hierhin?
RegistrationReadModel.prototype.durationFor = function (memberId) {
  return roomOptions.endOfStayFor(this.participantEventFor(memberId).duration);
};

RegistrationReadModel.prototype.durations = function () {

  return R.pipe(
    R.values, // only the events
    R.pluck('duration'), // pull out each duration
    R.groupBy(R.identity), // group same durations
    R.mapObjIndexed(function (value, key) { return {count: value.length, duration: roomOptions.endOfStayFor(key)}; })
  )(this.participantsByMemberId());

};

RegistrationReadModel.prototype.registeredAt = function (memberId) {
  return moment(this.participantEventFor(memberId).timestamp);
};

RegistrationReadModel.prototype.isAlreadyRegistered = function (memberId) {
  return !!this.participantEventFor(memberId);
};

RegistrationReadModel.prototype.allParticipantsIn = function (roomType) {
  return R.keys(this.participantsByMemberIdFor(roomType));
};

RegistrationReadModel.prototype.reservationsAndParticipantsFor = function (roomType) {
  return R.concat(R.values(this.reservationsBySessionIdFor(roomType)), R.values(this.participantsByMemberIdFor(roomType)));
};

var projectWaitinglistReservationsBySessionId = function (waitinglistReservationsBySessionId, event) {
  var thirtyMinutesAgo = moment.tz().subtract(30, 'minutes');
  if (event.event === e.WAITINGLIST_RESERVATION_WAS_ISSUED && moment(event.timestamp).isAfter(thirtyMinutesAgo)) {
    waitinglistReservationsBySessionId[event.sessionID] = event;
  }
  if (event.event === e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED || event.event === e.PARTICIPANT_WAS_REGISTERED) {
    delete waitinglistReservationsBySessionId[event.sessionID];
  }
  return waitinglistReservationsBySessionId;
};

RegistrationReadModel.prototype.waitinglistReservationsBySessionId = function () {
  if (!this._waitinglistReservationsBySessionId) {
    this._waitinglistReservationsBySessionId = R.reduce(projectWaitinglistReservationsBySessionId, {}, this._eventStore.registrationEvents());
  }
  return this._waitinglistReservationsBySessionId;
};

RegistrationReadModel.prototype.waitinglistReservationsBySessionIdFor = function (roomType) {
  return R.filter(function (event) { return R.contains(roomType, event.desiredRoomTypes); }, this.waitinglistReservationsBySessionId());
};

var projectWaitinglistParticipantsByMemberId = function (waitinglistParticipantsByMemberId, event) {
  if (event.event === e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED || event.event === e.DESIRED_ROOM_TYPES_WERE_CHANGED) {
    waitinglistParticipantsByMemberId[event.memberId] = event;
  }
  if (event.event === e.PARTICIPANT_WAS_REGISTERED) {
    delete waitinglistParticipantsByMemberId[event.memberId];
  }
  if (event.event === e.WAITINGLIST_PARTICIPANT_WAS_REMOVED) {
    delete waitinglistParticipantsByMemberId[event.memberId];
  }
  if (event.event === e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST) {
    delete waitinglistParticipantsByMemberId[event.memberId];
  }
  return waitinglistParticipantsByMemberId;
};

RegistrationReadModel.prototype.waitinglistParticipantsByMemberId = function () {
  if (!this._waitinglistParticipantsByMemberId) {
    this._waitinglistParticipantsByMemberId = R.reduce(projectWaitinglistParticipantsByMemberId, {}, this._eventStore.registrationEvents());
  }
  return this._waitinglistParticipantsByMemberId;
};

RegistrationReadModel.prototype.allWaitinglistParticipantsIn = function (roomType) {
  return R.keys(this.waitinglistParticipantsByMemberIdFor(roomType));
};

RegistrationReadModel.prototype.waitinglistParticipantCountFor = function (roomType) {
  return this.allWaitinglistParticipantsIn(roomType).length;
};

RegistrationReadModel.prototype.waitinglistParticipantsByMemberIdFor = function (roomType) {
  return R.filter(function (event) { return R.contains(roomType, event.desiredRoomTypes); }, this.waitinglistParticipantsByMemberId());
};

RegistrationReadModel.prototype.isFull = function (roomType) {
  return new SoCraTesReadModel(this._eventStore).quotaFor(roomType) <= this.reservationsAndParticipantsFor(roomType).length;
};

RegistrationReadModel.prototype._reservationOrWaitinglistReservationEventFor = function (sessionId) {
  return this.reservationsBySessionId()[sessionId] || this.waitinglistReservationsBySessionId()[sessionId];
};

function expirationTimeOf(event) {
  return moment(event.timestamp).add(socratesConstants.registrationPeriodinMinutes, 'minutes');
}

RegistrationReadModel.prototype.reservationExpiration = function (sessionId) {
  var event = this._reservationOrWaitinglistReservationEventFor(sessionId);
  return event && expirationTimeOf(event);
};

RegistrationReadModel.prototype.hasValidReservationFor = function (sessionId) {
  return !!this._reservationOrWaitinglistReservationEventFor(sessionId);
};

RegistrationReadModel.prototype.registeredInRoomType = function (memberID) {
  var participantEvent = this.participantEventFor(memberID);
  if (participantEvent) {
    return participantEvent.roomType;
  }
  return null;
};


RegistrationReadModel.prototype.waitinglistParticipantEventFor = function (memberId) {
  return this.waitinglistParticipantsByMemberId()[memberId];
};

RegistrationReadModel.prototype.isAlreadyOnWaitinglist = function (memberId) {
  return !!this.waitinglistParticipantEventFor(memberId);
};

RegistrationReadModel.prototype.selectedOptionsFor = function (memberID) {
  var participantEvent = this.participantEventFor(memberID);
  if (participantEvent) {
    return participantEvent.roomType + ',' + participantEvent.duration;
  }

  var waitinglistParticipantEvent = this.waitinglistParticipantEventFor(memberID);
  if (waitinglistParticipantEvent) {
    return waitinglistParticipantEvent.desiredRoomTypes.map(roomType => roomType + ',waitinglist').join(';');
  }
  return null;
};

RegistrationReadModel.prototype.roomTypesOf = function (memberId) {
  var participantEvent = this.participantEventFor(memberId);
  if (participantEvent) {
    return [participantEvent.roomType];
  }

  var waitinglistParticipantEvent = this.waitinglistParticipantEventFor(memberId);
  if (waitinglistParticipantEvent) {
    return waitinglistParticipantEvent.desiredRoomTypes;
  }
  return [];
};

// TODO this is currently for tests only...:
RegistrationReadModel.prototype.waitinglistReservationsAndParticipantsFor = function (roomType) {
  return R.concat(R.values(this.waitinglistReservationsBySessionIdFor(roomType)), R.values(this.waitinglistParticipantsByMemberIdFor(roomType)));
};

module.exports = RegistrationReadModel;
