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
  var event;
  if (this.writeModel.isFull(roomType)) {
    event = events.didNotIssueReservationForFullResource(roomType, duration, sessionId, memberId);
  } else if (this.writeModel.alreadyHasReservation(sessionId)) {
    // session id already reserved a spot
    event = events.didNotIssueReservationForAlreadyReservedSession(roomType, duration, sessionId, memberId);
  } else {
    // all is good
    event = events.reservationWasIssued(roomType, duration, sessionId, memberId, joinedSoCraTes);
  }
  this._updateRegistrationEvents(event);
  return event.event;
};

RegistrationCommandProcessor.prototype.registerParticipant = function (roomType, duration, sessionId, memberId, joinedSoCraTes) {
  var event;
  if (this.writeModel.alreadyHasReservation(sessionId)) {
    const reservation = this.writeModel.reservationFor(sessionId);
    event = events.participantWasRegistered(roomType, duration, sessionId, memberId, reservation.joinedSoCraTes);
  } else if (this.writeModel.isFull(roomType)) {
    event = events.didNotRegisterParticipantForFullResource(roomType, duration, sessionId, memberId);
  } else if (this.writeModel.isAlreadyRegistered(memberId) || this.writeModel.isAlreadyOnWaitinglist(memberId)) {
    event = events.didNotRegisterParticipantASecondTime(roomType, duration, sessionId, memberId);
  } else {
    // all is well
    event = events.participantWasRegistered(roomType, duration, sessionId, memberId, joinedSoCraTes);
  }
  this._updateRegistrationEvents(event);
  return event.event;
};

RegistrationCommandProcessor.prototype.removeParticipant = function (roomType, memberId) {
  var event;
  if (!this.writeModel.isAlreadyRegistered(memberId)) {
    event = events.didNotRemoveParticipantBecauseTheyAreNotRegistered(roomType, memberId);
  } else if (!this.writeModel.isRegisteredInRoomType(memberId, roomType)) {
    // not registered for this room
    event = events.didNotRemoveParticipantBecauseTheyAreNotRegisteredForThisRoomType(roomType, memberId);
  } else {
    event = events.participantWasRemoved(roomType, memberId);
  }
  this._updateRegistrationEvents(event);
};

RegistrationCommandProcessor.prototype.removeWaitinglistParticipant = function (desiredRoomTypes, memberId) {
  var event;
  if (!this.writeModel.isAlreadyOnWaitinglist(memberId)) {
    event = events.didNotRemoveWaitinglistParticipantBecauseTheyAreNotRegistered(desiredRoomTypes, memberId);
  } else {
    // all is well
    event = events.waitinglistParticipantWasRemoved(desiredRoomTypes, memberId);
  }
  this._updateRegistrationEvents(event);
};

RegistrationCommandProcessor.prototype.changeDesiredRoomTypes = function (memberId, desiredRoomTypes) {
  var event;
  if (!this.writeModel.isAlreadyOnWaitinglist(memberId)) {
    event = events.didNotChangeDesiredRoomTypesBecauseParticipantIsNotOnWaitinglist(memberId, desiredRoomTypes);
  } else if (misc.arraysAreEqual(this.writeModel.roomTypesOf(memberId), desiredRoomTypes)) {
    event = events.didNotChangeDesiredRoomTypesBecauseThereWasNoChange(memberId, desiredRoomTypes);
  } else {
    // all is well
    var waitinglistReservation = this.writeModel.waitinglistParticipantEventFor(memberId);
    event = events.desiredRoomTypesWereChanged(memberId, desiredRoomTypes, moment(waitinglistReservation.joinedWaitinglist));
  }
  this._updateRegistrationEvents(event);
};

RegistrationCommandProcessor.prototype.moveParticipantToNewRoomType = function (memberId, roomType) {
  var existingParticipantEvent = this.writeModel.participantEventFor(memberId);
  var event = existingParticipantEvent
    ? events.roomTypeWasChanged(memberId, roomType, existingParticipantEvent.duration, moment(existingParticipantEvent.joinedSoCraTes))
    : events.didNotChangeRoomTypeForNonParticipant(memberId, roomType);
  this._updateRegistrationEvents(event);
  return event;
};

RegistrationCommandProcessor.prototype.setNewDurationForParticipant = function (memberId, duration) {
  var existingParticipantEvent = this.writeModel.participantEventFor(memberId);
  var event = existingParticipantEvent
    ? events.durationWasChanged(memberId, existingParticipantEvent.roomType, duration, moment(existingParticipantEvent.joinedSoCraTes))
    : events.didNotChangeDurationForNonParticipant(memberId, duration);
  this._updateRegistrationEvents(event);
};

RegistrationCommandProcessor.prototype.issueWaitinglistReservation = function (desiredRoomTypes, sessionId, memberId, joinedWaitinglist) {
  var event;
  if (this.writeModel.alreadyHasWaitinglistReservation(sessionId)) {
    // session id already reserved a spot
    event = events.didNotIssueWaitinglistReservationForAlreadyReservedSession(desiredRoomTypes, sessionId, memberId);
  } else {
    // all is good
    event = events.waitinglistReservationWasIssued(desiredRoomTypes, sessionId, memberId, joinedWaitinglist);
  }
  this._updateRegistrationEvents(event);
  return event.event;
};

RegistrationCommandProcessor.prototype.registerWaitinglistParticipant = function (desiredRoomTypes, sessionId, memberId, joinedWaitinglist) {
  var event;
  if (this.writeModel.isAlreadyRegistered(memberId) || this.writeModel.isAlreadyOnWaitinglist(memberId)) {
    event = events.didNotRegisterWaitinglistParticipantASecondTime(desiredRoomTypes, sessionId, memberId);
  } else {
    // all is well
    var waitinglistReservation = this.writeModel.waitinglistReservation(sessionId);
    const joined = waitinglistReservation ? waitinglistReservation.joinedWaitinglist : joinedWaitinglist;
    event = events.waitinglistParticipantWasRegistered(desiredRoomTypes, sessionId, memberId, joined);
  }
  this._updateRegistrationEvents(event);
  return event.event;
};

RegistrationCommandProcessor.prototype.fromWaitinglistToParticipant = function (roomType, memberId, duration, joinedSoCraTes) {
  var event;
  if (this.writeModel.isAlreadyRegistered(memberId)) {
    event = events.didNotRegisterParticipantFromWaitinglistASecondTime(roomType, duration, memberId);
  } else if (!this.writeModel.isAlreadyOnWaitinglist(memberId)) {
    // we gracefully register them nonetheless:
    event = events.participantWasRegistered(roomType, duration, undefined, memberId, joinedSoCraTes);
  } else {
    // all is well
    event = events.registeredParticipantFromWaitinglist(roomType, duration, memberId, joinedSoCraTes);
  }
  this._updateRegistrationEvents(event);

};

///////////////////////////////////////////////////////////////////////////////////////////////////
RegistrationCommandProcessor.prototype._updateRegistrationEvents = function (newEvents) {
  if (!(newEvents instanceof Array)) {
    newEvents = [newEvents];
  }
  this.writeModel.updateRegistrationEvents(newEvents);
};

RegistrationCommandProcessor.prototype.eventStore = function () {
  return this.writeModel.eventStore();
};

module.exports = RegistrationCommandProcessor;
