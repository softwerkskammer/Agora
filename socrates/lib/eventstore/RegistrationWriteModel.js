/*eslint no-underscore-dangle: 0*/
'use strict';

function RegistrationWriteModel(eventStore, registrationReadModel) {
  this._eventStore = eventStore;
  this._registrationReadModel = registrationReadModel;
}

RegistrationWriteModel.prototype.reservationFor = function (sessionId) {
  return this._registrationReadModel.reservationsBySessionId()[sessionId];
};

RegistrationWriteModel.prototype.alreadyHasReservation = function (sessionId) {
  return !!this.reservationFor(sessionId);
};

RegistrationWriteModel.prototype.waitinglistReservation = function (sessionId) {
  return this._registrationReadModel.waitinglistReservationsBySessionId()[sessionId];
};

RegistrationWriteModel.prototype.alreadyHasWaitinglistReservation = function (sessionId) {
  return !!this.waitinglistReservation(sessionId);
};

// internal function?
RegistrationWriteModel.prototype.participantEventFor = function (memberId) {
  return this._registrationReadModel.participantEventFor(memberId);
};

RegistrationWriteModel.prototype.isAlreadyRegistered = function (memberId) {
  return this._registrationReadModel.isAlreadyRegistered(memberId);
};

RegistrationWriteModel.prototype.isRegisteredInRoomType = function (memberId, roomType) {
   return this._registrationReadModel.registeredInRoomType(memberId) === roomType;
};

RegistrationWriteModel.prototype.waitinglistParticipantEventFor = function (memberId) {
  return this._registrationReadModel.waitinglistParticipantEventFor(memberId);
};

RegistrationWriteModel.prototype.isAlreadyOnWaitinglist = function (memberId) {
  return this._registrationReadModel.isAlreadyOnWaitinglist(memberId);
};

RegistrationWriteModel.prototype.roomTypesOf = function (memberId) {
  return this._registrationReadModel.roomTypesOf(memberId);
};

/////////////////////////////////////////////////////////////////////////////////////////
RegistrationWriteModel.prototype.updateRegistrationEvents = function (newEvents) {
  this._eventStore.updateRegistrationEvents(newEvents);
};

RegistrationWriteModel.prototype.isFull = function (roomType) {
  return this._registrationReadModel.isFull(roomType);
};

RegistrationWriteModel.prototype.eventStore = function () {
  // persistence needs an id:
  this._eventStore.setId();
  return this._eventStore;
};

module.exports = RegistrationWriteModel;
