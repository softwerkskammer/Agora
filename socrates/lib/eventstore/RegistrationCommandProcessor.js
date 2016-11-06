/*eslint no-underscore-dangle: 0*/
'use strict';

const moment = require('moment-timezone');

const beans = require('simple-configure').get('beans');
const events = beans.get('events');
const misc = beans.get('misc');

class RegistrationCommandProcessor {

  constructor(url, writeModel) {
    this._url = url;
    this.writeModel = writeModel;
  }

  removeParticipant(roomType, memberId) {
    if (!this.writeModel.isAlreadyRegistered(memberId)) {
      return events.didNotRemoveParticipantBecauseTheyAreNotRegistered(roomType, memberId);
    }
    if (!this.writeModel.isRegisteredInRoomType(memberId, roomType)) {
      // not registered for this room
      return events.didNotRemoveParticipantBecauseTheyAreNotRegisteredForThisRoomType(roomType, memberId);
    }
    return events.participantWasRemoved(roomType, memberId);
  }

  removeWaitinglistParticipant(desiredRoomTypes, memberId) {
    if (!this.writeModel.isAlreadyOnWaitinglist(memberId)) {
      return events.didNotRemoveWaitinglistParticipantBecauseTheyAreNotRegistered(desiredRoomTypes, memberId);
    }
    // all is well
    return events.waitinglistParticipantWasRemoved(desiredRoomTypes, memberId);
  }

  changeDesiredRoomTypes(memberId, desiredRoomTypes) {
    if (!desiredRoomTypes) {
      return events.didNotChangeDesiredRoomTypesBecauseNoRoomTypesWereSelected(memberId);
    }
    if (!this.writeModel.isAlreadyOnWaitinglist(memberId)) {
      return events.didNotChangeDesiredRoomTypesBecauseParticipantIsNotOnWaitinglist(memberId, desiredRoomTypes);
    }
    if (misc.arraysAreEqual(this.writeModel.roomTypesOf(memberId), desiredRoomTypes)) {
      return events.didNotChangeDesiredRoomTypesBecauseThereWasNoChange(memberId, desiredRoomTypes);
    }
    // all is well
    const waitinglistReservation = this.writeModel.waitinglistParticipantEventFor(memberId);
    return events.desiredRoomTypesWereChanged(memberId, desiredRoomTypes, moment(waitinglistReservation.joinedWaitinglist));
  }

  moveParticipantToNewRoomType(memberId, roomType) {
    const existingParticipantEvent = this.writeModel.participantEventFor(memberId);
    return existingParticipantEvent
      ? events.roomTypeWasChanged(memberId, roomType, existingParticipantEvent.duration, moment(existingParticipantEvent.joinedSoCraTes))
      : events.didNotChangeRoomTypeForNonParticipant(memberId, roomType);
  }

  setNewDurationForParticipant(memberId, duration) {
    const existingParticipantEvent = this.writeModel.participantEventFor(memberId);
    return existingParticipantEvent
      ? events.durationWasChanged(memberId, existingParticipantEvent.roomType, duration, moment(existingParticipantEvent.joinedSoCraTes))
      : events.didNotChangeDurationForNonParticipant(memberId, duration);
  }

  issueWaitinglistReservation(desiredRoomTypes, duration, sessionId, memberId, joinedWaitinglist) {
    if (this.writeModel.alreadyHasWaitinglistReservation(sessionId)) {
      // session id already reserved a spot -> TODO change that in order to enable changes to the waitinglist by the user
      return events.didNotIssueWaitinglistReservationForAlreadyReservedSession(desiredRoomTypes, sessionId, memberId);
    }
    // all is good
    return events.waitinglistReservationWasIssued(desiredRoomTypes, duration, sessionId, memberId, joinedWaitinglist);
  }

  registerWaitinglistParticipant(desiredRoomTypes, sessionId, memberId) {
    if (this.writeModel.isAlreadyRegistered(memberId) || this.writeModel.isAlreadyOnWaitinglist(memberId)) {
      // TODO change that in order to enable changes to the waitinglist by the user
      return events.didNotRegisterWaitinglistParticipantASecondTime(desiredRoomTypes, sessionId, memberId);
    }
    if (!this.writeModel.alreadyHasWaitinglistReservation(sessionId)) {
      // TODO change that in order to enable changes to the waitinglist by the user
      return events.didNotRegisterWaitinglistParticipantWithExpiredOrMissingReservation(desiredRoomTypes, sessionId, memberId);
    }
    // all is well
    const waitinglistEvent = this.writeModel.waitinglistReservation(sessionId);
    return events.waitinglistParticipantWasRegistered(desiredRoomTypes, waitinglistEvent.duration, sessionId, memberId, this.writeModel.waitinglistReservation(sessionId).joinedWaitinglist);
  }

  fromWaitinglistToParticipant(roomType, memberId, joinedSoCraTes) {
    if (this.writeModel.isAlreadyRegistered(memberId)) {
      return events.didNotRegisterParticipantFromWaitinglistASecondTime(roomType, memberId);
    }
    if (!this.writeModel.isAlreadyOnWaitinglist(memberId)) {
      return events.didNotRegisterParticipantFromWaitinglistBecauseTheyWereNotOnWaitinglist(roomType, memberId);
    }
    // all is well
    const waitinglistEvent = this.writeModel.waitinglistParticipantEventFor(memberId);
    return events.registeredParticipantFromWaitinglist(roomType, waitinglistEvent.duration, memberId, joinedSoCraTes);
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  url() {
    return this._url;
  }
}
module.exports = RegistrationCommandProcessor;
