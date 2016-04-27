/*eslint no-underscore-dangle: 0*/
'use strict';

var R = require('ramda');
var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var e = beans.get('eventConstants');
var socratesConstants = beans.get('socratesConstants');
var roomOptions = beans.get('roomOptions');
var memoize = require('../eventstore/flushableMemoize');

function RegistrationReadModel(eventStore, soCraTesReadModel) {
  this._eventStore = eventStore;
  this._soCraTesReadModel = soCraTesReadModel;
}

var earliestValidRegistrationTime = moment.tz().subtract(socratesConstants.registrationPeriodinMinutes, 'minutes');

var projectReservationsBySessionId = function (reservationsBySessionId, event) {
  if (event.event === e.RESERVATION_WAS_ISSUED && moment(event.joinedSoCraTes).isAfter(earliestValidRegistrationTime)) {
    reservationsBySessionId[event.sessionId] = event;
  }
  if (event.event === e.PARTICIPANT_WAS_REGISTERED) {
    delete reservationsBySessionId[event.sessionId];
  }
  return reservationsBySessionId;
};

RegistrationReadModel.prototype.reservationsBySessionId = memoize(function () {
  return R.reduce(projectReservationsBySessionId, {}, this._eventStore.registrationEvents());
});

RegistrationReadModel.prototype.reservationsBySessionIdFor = memoize(function (roomType) {
  return R.filter(function (event) { return event.roomType === roomType; }, this.reservationsBySessionId());
});

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

RegistrationReadModel.prototype.participantsByMemberId = memoize(function () {
  return R.reduce(projectParticipantsByMemberId, {}, this._eventStore.registrationEvents());
});

RegistrationReadModel.prototype.participantsByMemberIdFor = memoize(function (roomType) {
  return R.filter(function (event) { return event.roomType === roomType; }, this.participantsByMemberId());
});

RegistrationReadModel.prototype.participantCountFor = memoize(function (roomType) {
  return this.allParticipantsIn(roomType).length;
});

RegistrationReadModel.prototype.participantEventFor = memoize(function (memberId) {
  return this.participantsByMemberId()[memberId];
});

// TODO hierhin?
RegistrationReadModel.prototype.durationFor = memoize(function (memberId) {
  return roomOptions.endOfStayFor(this.participantEventFor(memberId).duration);
});

RegistrationReadModel.prototype.durations = memoize(function () {

  return R.pipe(
    R.values, // only the events
    R.map(function(value){return value.duration;}), // pull out each duration
    R.groupBy(R.identity), // group same durations
    R.mapObjIndexed(function (value, key) { return {count: value.length, duration: roomOptions.endOfStayFor(key)}; })
  )(this.participantsByMemberId());
});

RegistrationReadModel.prototype.joinedSoCraTesAt = memoize(function (memberId) {
  return moment(this.participantEventFor(memberId).joinedSoCraTes);
});

RegistrationReadModel.prototype.joinedWaitinglistAt = memoize(function (memberId) {
  return moment(this.waitinglistParticipantEventFor(memberId).joinedWaitinglist);
});

RegistrationReadModel.prototype.isAlreadyRegistered = memoize(function (memberId) {
  return !!this.participantEventFor(memberId);
});

RegistrationReadModel.prototype.isAlreadyRegisteredFor = memoize(function (memberId, roomType) {
  const event = this.participantEventFor(memberId);
  return event && event.roomType === roomType;
});

RegistrationReadModel.prototype.isAlreadyOnWaitinglistFor = memoize(function (memberId, roomType) {
  const event = this.waitinglistParticipantEventFor(memberId);
  return event && R.contains(roomType, event.desiredRoomTypes);
});

RegistrationReadModel.prototype.allParticipantsIn = memoize(function (roomType) {
  return R.keys(this.participantsByMemberIdFor(roomType));
});

RegistrationReadModel.prototype.reservationsAndParticipantsFor = memoize(function (roomType) {
  return R.concat(R.values(this.reservationsBySessionIdFor(roomType)), R.values(this.participantsByMemberIdFor(roomType)));
});

var projectWaitinglistReservationsBySessionId = function (waitinglistReservationsBySessionId, event) {
  if (event.event === e.WAITINGLIST_RESERVATION_WAS_ISSUED && moment(event.joinedWaitinglist).isAfter(earliestValidRegistrationTime)) {
    waitinglistReservationsBySessionId[event.sessionId] = event;
  }
  if (event.event === e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED || event.event === e.PARTICIPANT_WAS_REGISTERED) {
    delete waitinglistReservationsBySessionId[event.sessionId];
  }
  return waitinglistReservationsBySessionId;
};

RegistrationReadModel.prototype.waitinglistReservationsBySessionId = memoize(function () {
  return R.reduce(projectWaitinglistReservationsBySessionId, {}, this._eventStore.registrationEvents());
});

RegistrationReadModel.prototype.waitinglistReservationsBySessionIdFor = memoize(function (roomType) {
  return R.filter(function (event) { return R.contains(roomType, event.desiredRoomTypes); }, this.waitinglistReservationsBySessionId());
});

var projectWaitinglistParticipantsByMemberId = function (waitinglistParticipantsByMemberId, event) {
  if (event.event === e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED || event.event === e.DESIRED_ROOM_TYPES_WERE_CHANGED) {
    waitinglistParticipantsByMemberId[event.memberId] = event;
  }
  if (event.event === e.WAITINGLIST_PARTICIPANT_WAS_REMOVED) {
    delete waitinglistParticipantsByMemberId[event.memberId];
  }
  if (event.event === e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST) {
    delete waitinglistParticipantsByMemberId[event.memberId];
  }
  return waitinglistParticipantsByMemberId;
};

RegistrationReadModel.prototype.waitinglistParticipantsByMemberId = memoize(function () {
  return R.reduce(projectWaitinglistParticipantsByMemberId, {}, this._eventStore.registrationEvents());
});

RegistrationReadModel.prototype.allWaitinglistParticipantsIn = memoize(function (roomType) {
  return R.keys(this.waitinglistParticipantsByMemberIdFor(roomType));
});

RegistrationReadModel.prototype.waitinglistParticipantCountFor = memoize(function (roomType) {
  return this.allWaitinglistParticipantsIn(roomType).length;
});

RegistrationReadModel.prototype.waitinglistParticipantsByMemberIdFor = memoize(function (roomType) {
  return R.filter(function (event) { return R.contains(roomType, event.desiredRoomTypes); }, this.waitinglistParticipantsByMemberId());
});

RegistrationReadModel.prototype.isFull = memoize(function (roomType) {
  return this._soCraTesReadModel.quotaFor(roomType) <= this.reservationsAndParticipantsFor(roomType).length;
});

RegistrationReadModel.prototype._reservationOrWaitinglistReservationEventFor = memoize(function (sessionId) {
  return this.reservationsBySessionId()[sessionId] || this.waitinglistReservationsBySessionId()[sessionId];
});

function expirationTimeOf(event) {
  var joinedAt = event.joinedSoCraTes || event.joinedWaitinglist;
  return joinedAt ? moment(joinedAt).add(socratesConstants.registrationPeriodinMinutes, 'minutes') : undefined;
}

RegistrationReadModel.prototype.reservationExpiration = memoize(function (sessionId) {
  var event = this._reservationOrWaitinglistReservationEventFor(sessionId);
  return event && expirationTimeOf(event);
});

RegistrationReadModel.prototype.hasValidReservationFor = memoize(function (sessionId) {
  return !!this._reservationOrWaitinglistReservationEventFor(sessionId);
});

RegistrationReadModel.prototype.registeredInRoomType = memoize(function (memberID) {
  var participantEvent = this.participantEventFor(memberID);
  if (participantEvent) {
    return participantEvent.roomType;
  }
  return null;
});

RegistrationReadModel.prototype.waitinglistParticipantEventFor = memoize(function (memberId) {
  return this.waitinglistParticipantsByMemberId()[memberId];
});

RegistrationReadModel.prototype.isAlreadyOnWaitinglist = memoize(function (memberId) {
  return !!this.waitinglistParticipantEventFor(memberId);
});

RegistrationReadModel.prototype.selectedOptionsFor = memoize(function (memberID) {
  var options = [];
  var participantEvent = this.participantEventFor(memberID);
  if (participantEvent) {
    options.push(participantEvent.roomType + ',' + participantEvent.duration);
  }

  var waitinglistParticipantEvent = this.waitinglistParticipantEventFor(memberID);
  if (waitinglistParticipantEvent) {
    waitinglistParticipantEvent.desiredRoomTypes.forEach(roomType => options.push(roomType + ',waitinglist'));
  }
  return options.join(';');
});

RegistrationReadModel.prototype.roomTypesOf = memoize(function (memberId) {
  var participantEvent = this.participantEventFor(memberId);
  if (participantEvent) {
    return [participantEvent.roomType];
  }

  var waitinglistParticipantEvent = this.waitinglistParticipantEventFor(memberId);
  if (waitinglistParticipantEvent) {
    return waitinglistParticipantEvent.desiredRoomTypes;
  }
  return [];
});

// TODO this is currently for tests only...:
RegistrationReadModel.prototype.waitinglistReservationsAndParticipantsFor = function (roomType) {
  return R.concat(R.values(this.waitinglistReservationsBySessionIdFor(roomType)), R.values(this.waitinglistParticipantsByMemberIdFor(roomType)));
};

module.exports = RegistrationReadModel;
