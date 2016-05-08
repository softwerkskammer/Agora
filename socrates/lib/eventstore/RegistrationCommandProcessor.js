/*eslint no-underscore-dangle: 0*/
'use strict';

var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var events = beans.get('events');
var misc = beans.get('misc');

function RegistrationCommandProcessor(writeModel) {
  this.writeModel = writeModel;
}

RegistrationCommandProcessor.prototype.issueReservation = function (roomType, duration, sessionId, memberId, joinedSoCraTes) {
  if (this.writeModel.isFull(roomType)) {
    return events.didNotIssueReservationForFullResource(roomType, duration, sessionId, memberId);
  } else if (this.writeModel.alreadyHasReservation(sessionId)) {
    // session id already reserved a spot
    return events.didNotIssueReservationForAlreadyReservedSession(roomType, duration, sessionId, memberId);
  } else {
    // all is good
    return events.reservationWasIssued(roomType, duration, sessionId, memberId, joinedSoCraTes);
  }
};

RegistrationCommandProcessor.prototype.registerParticipant = function (roomType, duration, sessionId, memberId) {
  if (this.writeModel.isAlreadyRegistered(memberId) || this.writeModel.isAlreadyOnWaitinglist(memberId)) {
    return events.didNotRegisterParticipantASecondTime(roomType, duration, sessionId, memberId);
  } else if (!this.writeModel.alreadyHasReservation(sessionId)) {
    return events.didNotRegisterParticipantWithExpiredOrMissingReservation(roomType, duration, sessionId, memberId);
  } else {
    // all is well
    const reservation = this.writeModel.reservationFor(sessionId);
    return events.participantWasRegistered(roomType, duration, sessionId, memberId, reservation.joinedSoCraTes);
  }
};

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

RegistrationCommandProcessor.prototype.issueWaitinglistReservation = function (desiredRoomTypes, sessionId, memberId, joinedWaitinglist) {
  if (this.writeModel.alreadyHasWaitinglistReservation(sessionId)) {
    // session id already reserved a spot
    return events.didNotIssueWaitinglistReservationForAlreadyReservedSession(desiredRoomTypes, sessionId, memberId);
  } else {
    // all is good
    return events.waitinglistReservationWasIssued(desiredRoomTypes, sessionId, memberId, joinedWaitinglist);
  }
};

RegistrationCommandProcessor.prototype.registerWaitinglistParticipant = function (desiredRoomTypes, sessionId, memberId) {
  if (this.writeModel.isAlreadyRegistered(memberId) || this.writeModel.isAlreadyOnWaitinglist(memberId)) {
    return events.didNotRegisterWaitinglistParticipantASecondTime(desiredRoomTypes, sessionId, memberId);
  } else if (!this.writeModel.alreadyHasWaitinglistReservation(sessionId)) {
    return events.didNotRegisterWaitinglistParticipantWithExpiredOrMissingReservation(desiredRoomTypes, sessionId, memberId);
  } else {
    // all is well
    return events.waitinglistParticipantWasRegistered(desiredRoomTypes, sessionId, memberId, this.writeModel.waitinglistReservation(sessionId).joinedWaitinglist);
  }
};

RegistrationCommandProcessor.prototype.fromWaitinglistToParticipant = function (roomType, memberId, duration, joinedSoCraTes) {
  if (this.writeModel.isAlreadyRegistered(memberId)) {
    return events.didNotRegisterParticipantFromWaitinglistASecondTime(roomType, duration, memberId);
  } else if (!this.writeModel.isAlreadyOnWaitinglist(memberId)) {
    // we gracefully register them nonetheless:
    return events.participantWasRegistered(roomType, duration, undefined, memberId, joinedSoCraTes);
  } else {
    // all is well
    return events.registeredParticipantFromWaitinglist(roomType, duration, memberId, joinedSoCraTes);
  }
};

///////////////////////////////////////////////////////////////////////////////////////////////////
RegistrationCommandProcessor.prototype.updateEventStore = function (newEvents) {
  if (!(newEvents instanceof Array)) {
    newEvents = [newEvents];
  }
  this.writeModel.updateRegistrationEvents(newEvents);
};

RegistrationCommandProcessor.prototype.eventStore = function () {
  return this.writeModel.eventStore();
};

module.exports = RegistrationCommandProcessor;
