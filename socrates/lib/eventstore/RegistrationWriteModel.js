/*eslint no-underscore-dangle: 0*/
'use strict';

const R = require('ramda');
const moment = require('moment-timezone');

const beans = require('simple-configure').get('beans');
const e = beans.get('eventConstants');
const socratesConstants = beans.get('socratesConstants');

const earliestValidRegistrationTime = moment.tz().subtract(socratesConstants.registrationPeriodinMinutes, 'minutes');

function processParticipantsByMemberId(participantsByMemberId, event) {
  if (event.event === e.ROOM_TYPE_WAS_CHANGED
    || event.event === e.DURATION_WAS_CHANGED
    || event.event === e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST) {
    participantsByMemberId[event.memberId] = event;
  }
  if (event.event === e.PARTICIPANT_WAS_REMOVED) {
    delete participantsByMemberId[event.memberId];
  }
  return participantsByMemberId;
}

function processWaitinglistReservationsBySessionId(waitinglistReservationsBySessionId, event) {
  if (event.event === e.WAITINGLIST_RESERVATION_WAS_ISSUED && moment(event.joinedWaitinglist).isAfter(earliestValidRegistrationTime)) {
    waitinglistReservationsBySessionId[event.sessionId] = event;
  }
  if (event.event === e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED) {
    delete waitinglistReservationsBySessionId[event.sessionId];
  }
  return waitinglistReservationsBySessionId;
}

function processWaitinglistParticipantsByMemberId(waitinglistParticipantsByMemberId, event) {
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
}

function expirationTimeOf(event) {
  const joinedAt = event.joinedSoCraTes || event.joinedWaitinglist;
  return joinedAt ? moment(joinedAt).add(socratesConstants.registrationPeriodinMinutes, 'minutes') : undefined;
}

class RegistrationWriteModel {

  constructor(events) {

    // write model state:
    this._participantsByMemberId = {};
    this._waitinglistReservationsBySessionId = {};
    this._waitinglistParticipantsByMemberId = {};

    this.update(events);
  }

  update(events) {
    this._participantsByMemberId = R.reduce(processParticipantsByMemberId, this._participantsByMemberId, events);
    this._waitinglistReservationsBySessionId = R.reduce(processWaitinglistReservationsBySessionId, this._waitinglistReservationsBySessionId, events);
    this._waitinglistParticipantsByMemberId = R.reduce(processWaitinglistParticipantsByMemberId, this._waitinglistParticipantsByMemberId, events);
  }

  waitinglistReservation(sessionId) {
    return this._waitinglistReservationsBySessionId[sessionId];
  }

  alreadyHasWaitinglistReservation(sessionId) {
    return !!this.waitinglistReservation(sessionId);
  }

  participantEventFor(memberId) {
    return this._participantsByMemberId[memberId];
  }

  isAlreadyRegistered(memberId) {
    return !!this.participantEventFor(memberId);
  }

  isRegisteredInRoomType(memberId, roomType) {
    const participantEvent = this.participantEventFor(memberId);
    return participantEvent ? participantEvent.roomType === roomType : false;
  }

  waitinglistParticipantEventFor(memberId) {
    return this._waitinglistParticipantsByMemberId[memberId];
  }

  isAlreadyOnWaitinglist(memberId) {
    return !!this.waitinglistParticipantEventFor(memberId);
  }

  reservationExpiration(sessionId) {
    const event = this._waitinglistReservationsBySessionId[sessionId];
    return event && expirationTimeOf(event);
  }

  roomTypesOf(memberId) {
    const participantEvent = this.participantEventFor(memberId);
    if (participantEvent) {
      return [participantEvent.roomType];
    }

    const waitinglistParticipantEvent = this.waitinglistParticipantEventFor(memberId);
    return waitinglistParticipantEvent ? waitinglistParticipantEvent.desiredRoomTypes : [];
  }
}

module.exports = RegistrationWriteModel;
