/*eslint no-underscore-dangle: 0*/
'use strict';

var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var events = beans.get('events');
var misc = beans.get('misc');

function RegistrationCommandProcessor(writeModel) {
  this.writeModel = writeModel;
}

RegistrationCommandProcessor.prototype.removeParticipant = function (roomType, memberId) {
  if (!this.writeModel.isAlreadyRegistered(memberId)) {
    return events.didNotRemoveParticipantBecauseTheyAreNotRegistered(roomType, memberId);
  } else if (!this.writeModel.isRegisteredInRoomType(memberId, roomType)) {
    // not registered for this room
    return events.didNotRemoveParticipantBecauseTheyAreNotRegisteredForThisRoomType(roomType, memberId);
  } else {
    return events.participantWasRemoved(roomType, memberId);
  }
};

RegistrationCommandProcessor.prototype.removeWaitinglistParticipant = function (desiredRoomTypes, memberId) {
  if (!this.writeModel.isAlreadyOnWaitinglist(memberId)) {
    return events.didNotRemoveWaitinglistParticipantBecauseTheyAreNotRegistered(desiredRoomTypes, memberId);
  } else {
    // all is well
    return events.waitinglistParticipantWasRemoved(desiredRoomTypes, memberId);
  }
};

RegistrationCommandProcessor.prototype.changeDesiredRoomTypes = function (memberId, desiredRoomTypes) {
  if (!desiredRoomTypes) {
    return events.didNotChangeDesiredRoomTypesBecauseNoRoomTypesWereSelected(memberId);
  } else if (!this.writeModel.isAlreadyOnWaitinglist(memberId)) {
    return events.didNotChangeDesiredRoomTypesBecauseParticipantIsNotOnWaitinglist(memberId, desiredRoomTypes);
  } else if (misc.arraysAreEqual(this.writeModel.roomTypesOf(memberId), desiredRoomTypes)) {
    return events.didNotChangeDesiredRoomTypesBecauseThereWasNoChange(memberId, desiredRoomTypes);
  } else {
    // all is well
    var waitinglistReservation = this.writeModel.waitinglistParticipantEventFor(memberId);
    return events.desiredRoomTypesWereChanged(memberId, desiredRoomTypes, moment(waitinglistReservation.joinedWaitinglist));
  }
};

RegistrationCommandProcessor.prototype.moveParticipantToNewRoomType = function (memberId, roomType) {
  var existingParticipantEvent = this.writeModel.participantEventFor(memberId);
  return existingParticipantEvent
    ? events.roomTypeWasChanged(memberId, roomType, existingParticipantEvent.duration, moment(existingParticipantEvent.joinedSoCraTes))
    : events.didNotChangeRoomTypeForNonParticipant(memberId, roomType);
};

RegistrationCommandProcessor.prototype.setNewDurationForParticipant = function (memberId, duration) {
  var existingParticipantEvent = this.writeModel.participantEventFor(memberId);
  return existingParticipantEvent
    ? events.durationWasChanged(memberId, existingParticipantEvent.roomType, duration, moment(existingParticipantEvent.joinedSoCraTes))
    : events.didNotChangeDurationForNonParticipant(memberId, duration);
};

RegistrationCommandProcessor.prototype.issueWaitinglistReservation = function (desiredRoomTypes, duration, sessionId, memberId, joinedWaitinglist) {
  if (this.writeModel.alreadyHasWaitinglistReservation(sessionId)) {
    // session id already reserved a spot -> TODO change that in order to enable changes to the waitinglist by the user
    return events.didNotIssueWaitinglistReservationForAlreadyReservedSession(desiredRoomTypes, sessionId, memberId);
  } else {
    // all is good
    return events.waitinglistReservationWasIssued(desiredRoomTypes, duration, sessionId, memberId, joinedWaitinglist);
  }
};

RegistrationCommandProcessor.prototype.registerWaitinglistParticipant = function (desiredRoomTypes, duration, sessionId, memberId) {
  if (this.writeModel.isAlreadyRegistered(memberId) || this.writeModel.isAlreadyOnWaitinglist(memberId)) {
    // TODO change that in order to enable changes to the waitinglist by the user
    return events.didNotRegisterWaitinglistParticipantASecondTime(desiredRoomTypes, sessionId, memberId);
  } else if (!this.writeModel.alreadyHasWaitinglistReservation(sessionId)) {
    // TODO change that in order to enable changes to the waitinglist by the user
    return events.didNotRegisterWaitinglistParticipantWithExpiredOrMissingReservation(desiredRoomTypes, sessionId, memberId);
  } else {
    // all is well
    return events.waitinglistParticipantWasRegistered(desiredRoomTypes, duration, sessionId, memberId, this.writeModel.waitinglistReservation(sessionId).joinedWaitinglist);
  }
};

RegistrationCommandProcessor.prototype.fromWaitinglistToParticipant = function (roomType, memberId, duration, joinedSoCraTes) {
  if (this.writeModel.isAlreadyRegistered(memberId)) {
    return events.didNotRegisterParticipantFromWaitinglistASecondTime(roomType, duration, memberId);
  } else if (!this.writeModel.isAlreadyOnWaitinglist(memberId)) {
    return events.didNotRegisterParticipantFromWaitinglistBecauseTheyWereNotOnWaitinglist(roomType, duration, memberId);
  } else {
    // all is well
    return events.registeredParticipantFromWaitinglist(roomType, duration, memberId, joinedSoCraTes);
  }
};

///////////////////////////////////////////////////////////////////////////////////////////////////
RegistrationCommandProcessor.prototype.eventStore = function () {
  return this.writeModel.eventStore();
};

module.exports = RegistrationCommandProcessor;
