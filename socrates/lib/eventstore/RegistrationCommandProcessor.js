/*eslint no-underscore-dangle: 0*/
'use strict';

var beans = require('simple-configure').get('beans');
var events = beans.get('events');


function RegistrationCommandProcessor(writeModel) {
  this.writeModel = writeModel;
}

RegistrationCommandProcessor.prototype.issueReservation = function (roomType, duration, sessionId) {
  var event;
  if (this.writeModel.isFull(roomType)) {
    event = events.didNotIssueReservationForFullResource(roomType, duration, sessionId);
  } else if (this.writeModel.alreadyHasReservation(sessionId)) {
    // session id already reserved a spot
    event = events.didNotIssueReservationForAlreadyReservedSession(roomType, duration, sessionId);
  } else {
    // all is good
    event = events.reservationWasIssued(roomType, duration, sessionId);
  }
  this._updateRegistrationEvents(event);
  return event.event;
};

RegistrationCommandProcessor.prototype.registerParticipant = function (roomType, duration, sessionId, memberId) {
  var event;
  if (this.writeModel.alreadyHasReservation(sessionId)) {
    event = events.participantWasRegistered(roomType, duration, sessionId, memberId);
  } else if (this.writeModel.isFull(roomType)) {
    event = events.didNotRegisterParticipantForFullResource(roomType, duration, sessionId, memberId);
  } else if (this.writeModel.isAlreadyRegistered(memberId) || this.writeModel.isAlreadyOnWaitinglist(memberId)) {
    event = events.didNotRegisterParticipantASecondTime(roomType, duration, sessionId, memberId);
  } else {
    // all is well
    event = events.participantWasRegistered(roomType, duration, sessionId, memberId);
  }
  this._updateRegistrationEvents(event);
  return event.event;
};

RegistrationCommandProcessor.prototype.moveParticipantToNewRoomType = function (memberId, roomType) {
  var existingParticipantEvent = this.writeModel.participantEventFor(memberId);
  var event = existingParticipantEvent ? events.roomTypeWasChanged(memberId, roomType, existingParticipantEvent.duration) : events.didNotChangeRoomTypeForNonParticipant(memberId, roomType);
  this._updateRegistrationEvents(event);
};

RegistrationCommandProcessor.prototype.setNewDurationForParticipant = function (memberId, duration) {
  var existingParticipantEvent = this.writeModel.participantEventFor(memberId);
  var event = existingParticipantEvent ? events.durationWasChanged(memberId, existingParticipantEvent.roomType, duration) : events.didNotChangeDurationForNonParticipant(memberId, duration);
  this._updateRegistrationEvents(event);
};

RegistrationCommandProcessor.prototype.issueWaitinglistReservation = function (roomType, sessionId) {
  var event;
  if (this.writeModel.alreadyHasWaitinglistReservation(sessionId)) {
    // session id already reserved a spot
    event = events.didNotIssueWaitinglistReservationForAlreadyReservedSession(roomType, sessionId);
  } else {
    // all is good
    event = events.waitinglistReservationWasIssued(roomType, sessionId);
  }
  this._updateRegistrationEvents(event);
  return event.event;
};

RegistrationCommandProcessor.prototype.registerWaitinglistParticipant = function (roomType, sessionId, memberId) {
  var event;
  if (this.writeModel.isAlreadyRegistered(memberId) || this.writeModel.isAlreadyOnWaitinglist(memberId)) {
    event = events.didNotRegisterParticipantASecondTime(roomType, 'waitinglist', sessionId, memberId);
  } else {
    // all is well
    event = events.waitinglistParticipantWasRegistered(roomType, sessionId, memberId);
  }
  this._updateRegistrationEvents(event);
  return event.event;
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
