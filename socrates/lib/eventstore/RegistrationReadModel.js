/*eslint no-underscore-dangle: 0*/
'use strict';

const R = require('ramda');
const moment = require('moment-timezone');

const beans = require('simple-configure').get('beans');
const e = beans.get('eventConstants');
const roomOptions = beans.get('roomOptions');

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

class RegistrationReadModel {

  constructor(events) {

    // read model state:
    this._participantsByMemberId = {};
    this._waitinglistParticipantsByMemberId = {};

    this._participantsByMemberIdFor = {};
    this._waitinglistParticipantsByMemberIdFor = {};
    this._durations = [];

    this.update(events);
  }

  update(events) {
    // core data:
    this._participantsByMemberId = R.reduce(processParticipantsByMemberId, this._participantsByMemberId, events);
    this._waitinglistParticipantsByMemberId = R.reduce(processWaitinglistParticipantsByMemberId, this._waitinglistParticipantsByMemberId, events);

    // derived data:
    roomOptions.allIds().forEach(roomType => {
      this._participantsByMemberIdFor[roomType] = R.filter(event => event.roomType === roomType, this._participantsByMemberId);
      this._waitinglistParticipantsByMemberIdFor[roomType] = R.filter(event => R.contains(roomType, event.desiredRoomTypes), this.waitinglistParticipantsByMemberId());
    });

    this._durations = R.pipe(
      R.values, // only the events
      R.pluck('duration'), // pull out each duration
      R.groupBy(R.identity), // group same durations
      R.mapObjIndexed((value, key) => { return {count: value.length, duration: roomOptions.endOfStayFor(key)}; })
    )(this._participantsByMemberId);
  }

  registeredMemberIds() {
    return R.keys(this._participantsByMemberId);
  }

  participantCountFor(roomType) {
    return this.allParticipantsIn(roomType).length;
  }

  // TODO from write model? Only used for duration & roomType?
  participantEventFor(memberId) {
    return this._participantsByMemberId[memberId];
  }

  durationFor(memberId) {
    return roomOptions.endOfStayFor(this.participantEventFor(memberId).duration);
  }

  durations() {
    return this._durations;
  }

  joinedSoCraTesAt(memberId) {
    return moment(this.participantEventFor(memberId).joinedSoCraTes);
  }

  joinedWaitinglistAt(memberId) {
    return moment(this.waitinglistParticipantEventFor(memberId).joinedWaitinglist);
  }

  isAlreadyRegistered(memberId) {
    return !!this.participantEventFor(memberId);
  }

  allParticipantsIn(roomType) {
    return R.keys(this._participantsByMemberIdFor[roomType]);
  }

  waitinglistParticipantsByMemberId() {
    return this._waitinglistParticipantsByMemberId;
  }

  allWaitinglistParticipantsIn(roomType) {
    return R.keys(this.waitinglistParticipantsByMemberIdFor(roomType));
  }

  waitinglistParticipantCountFor(roomType) {
    return this.allWaitinglistParticipantsIn(roomType).length;
  }

  waitinglistParticipantsByMemberIdFor(roomType) {
    return this._waitinglistParticipantsByMemberIdFor[roomType];
  }

  registeredInRoomType(memberId) {
    const participantEvent = this.participantEventFor(memberId);
    return participantEvent ? participantEvent.roomType : null;
  }

  waitinglistParticipantEventFor(memberId) {
    return this.waitinglistParticipantsByMemberId()[memberId];
  }

  isAlreadyOnWaitinglist(memberId) {
    return !!this.waitinglistParticipantEventFor(memberId);
  }

  selectedOptionsFor(memberID) {
    const options = [];
    const participantEvent = this.participantEventFor(memberID);
    if (participantEvent) {
      options.push(participantEvent.roomType + ',' + participantEvent.duration);
    }

    const waitinglistParticipantEvent = this.waitinglistParticipantEventFor(memberID);
    if (waitinglistParticipantEvent) {
      waitinglistParticipantEvent.desiredRoomTypes.forEach(roomType => options.push(roomType + ',waitinglist,' + waitinglistParticipantEvent.duration));
    }
    return options.join(';');
  }

  roomTypesOf(memberId) {
    const participantEvent = this.participantEventFor(memberId);
    if (participantEvent) {
      return [participantEvent.roomType];
    }

    const waitinglistParticipantEvent = this.waitinglistParticipantEventFor(memberId);
    return waitinglistParticipantEvent ? waitinglistParticipantEvent.desiredRoomTypes : [];
  }

  // TODO this is currently for tests only...:
  waitinglistParticipantValuesFor(roomType) {
    return R.values(this.waitinglistParticipantsByMemberIdFor(roomType));
  }
}

module.exports = RegistrationReadModel;
