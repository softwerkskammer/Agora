/*eslint no-underscore-dangle: 0*/
'use strict';

const moment = require('moment-timezone');

const beans = require('simple-configure').get('beans');
const events = beans.get('events');
const misc = beans.get('misc');

function RegistrationCommandProcessor(writeModel) {
  this.writeModel = writeModel;
}

RegistrationCommandProcessor.prototype.removeParticipant = function removeParticipant(roomType, memberId) {
  if (!this.writeModel.isAlreadyRegistered(memberId)) {
    return events.didNotRemoveParticipantBecauseTheyAreNotRegistered(roomType, memberId);
  } else if (!this.writeModel.isRegisteredInRoomType(memberId, roomType)) {
    // not registered for this room
    return events.didNotRemoveParticipantBecauseTheyAreNotRegisteredForThisRoomType(roomType, memberId);
  } else {
    return events.participantWasRemoved(roomType, memberId);
  }
};

RegistrationCommandProcessor.prototype.removeWaitinglistParticipant = function removeWaitinglistParticipant(desiredRoomTypes, memberId) {
  if (!this.writeModel.isAlreadyOnWaitinglist(memberId)) {
    return events.didNotRemoveWaitinglistParticipantBecauseTheyAreNotRegistered(desiredRoomTypes, memberId);
  } else {
    // all is well
    return events.waitinglistParticipantWasRemoved(desiredRoomTypes, memberId);
  }
};

RegistrationCommandProcessor.prototype.changeDesiredRoomTypes = function changeDesiredRoomTypes(memberId, desiredRoomTypes) {
  if (!desiredRoomTypes) {
    return events.didNotChangeDesiredRoomTypesBecauseNoRoomTypesWereSelected(memberId);
  } else if (!this.writeModel.isAlreadyOnWaitinglist(memberId)) {
    return events.didNotChangeDesiredRoomTypesBecauseParticipantIsNotOnWaitinglist(memberId, desiredRoomTypes);
  } else if (misc.arraysAreEqual(this.writeModel.roomTypesOf(memberId), desiredRoomTypes)) {
    return events.didNotChangeDesiredRoomTypesBecauseThereWasNoChange(memberId, desiredRoomTypes);
  } else {
    // all is well
    const waitinglistReservation = this.writeModel.waitinglistParticipantEventFor(memberId);
    return events.desiredRoomTypesWereChanged(memberId, desiredRoomTypes, moment(waitinglistReservation.joinedWaitinglist));
  }
};

RegistrationCommandProcessor.prototype.moveParticipantToNewRoomType = function moveParticipantToNewRoomType(memberId, roomType) {
  const existingParticipantEvent = this.writeModel.participantEventFor(memberId);
  return existingParticipantEvent
    ? events.roomTypeWasChanged(memberId, roomType, existingParticipantEvent.duration, moment(existingParticipantEvent.joinedSoCraTes))
    : events.didNotChangeRoomTypeForNonParticipant(memberId, roomType);
};

RegistrationCommandProcessor.prototype.setNewDurationForParticipant = function setNewDurationForParticipant(memberId, duration) {
  const existingParticipantEvent = this.writeModel.participantEventFor(memberId);
  return existingParticipantEvent
    ? events.durationWasChanged(memberId, existingParticipantEvent.roomType, duration, moment(existingParticipantEvent.joinedSoCraTes))
    : events.didNotChangeDurationForNonParticipant(memberId, duration);
};

RegistrationCommandProcessor.prototype.issueWaitinglistReservation = function issueWaitinglistReservation(desiredRoomTypes, duration, sessionId, memberId, joinedWaitinglist) {
  if (this.writeModel.alreadyHasWaitinglistReservation(sessionId)) {
    // session id already reserved a spot -> TODO change that in order to enable changes to the waitinglist by the user
    return events.didNotIssueWaitinglistReservationForAlreadyReservedSession(desiredRoomTypes, sessionId, memberId);
  } else {
    // all is good
    return events.waitinglistReservationWasIssued(desiredRoomTypes, duration, sessionId, memberId, joinedWaitinglist);
  }
};

RegistrationCommandProcessor.prototype.registerWaitinglistParticipant = function registerWaitinglistParticipant(desiredRoomTypes, sessionId, memberId) {
  if (this.writeModel.isAlreadyRegistered(memberId) || this.writeModel.isAlreadyOnWaitinglist(memberId)) {
    // TODO change that in order to enable changes to the waitinglist by the user
    return events.didNotRegisterWaitinglistParticipantASecondTime(desiredRoomTypes, sessionId, memberId);
  } else if (!this.writeModel.alreadyHasWaitinglistReservation(sessionId)) {
    // TODO change that in order to enable changes to the waitinglist by the user
    return events.didNotRegisterWaitinglistParticipantWithExpiredOrMissingReservation(desiredRoomTypes, sessionId, memberId);
  } else {
    // all is well
    const waitinglistEvent = this.writeModel.waitinglistReservation(sessionId);
    return events.waitinglistParticipantWasRegistered(desiredRoomTypes, waitinglistEvent.duration, sessionId, memberId, this.writeModel.waitinglistReservation(sessionId).joinedWaitinglist);
  }
};

RegistrationCommandProcessor.prototype.fromWaitinglistToParticipant = function fromWaitinglistToParticipant(roomType, memberId, joinedSoCraTes) {
  if (this.writeModel.isAlreadyRegistered(memberId)) {
    return events.didNotRegisterParticipantFromWaitinglistASecondTime(roomType, memberId);
  } else if (!this.writeModel.isAlreadyOnWaitinglist(memberId)) {
    return events.didNotRegisterParticipantFromWaitinglistBecauseTheyWereNotOnWaitinglist(roomType, memberId);
  } else {
    // all is well
    const waitinglistEvent = this.writeModel.waitinglistParticipantEventFor(memberId);
    return events.registeredParticipantFromWaitinglist(roomType, waitinglistEvent.duration, memberId, joinedSoCraTes);
  }
};

///////////////////////////////////////////////////////////////////////////////////////////////////
RegistrationCommandProcessor.prototype.eventStore = function eventStore() {
  return this.writeModel.eventStore();
};

module.exports = RegistrationCommandProcessor;
