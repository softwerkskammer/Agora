/*eslint no-underscore-dangle: 0*/
'use strict';

var beans = require('simple-configure').get('beans');
var RegistrationReadModel = beans.get('RegistrationReadModel');


function RegistrationWriteModel(eventStore) {
  this._eventStore = eventStore;
  this.registrationReadModel = new RegistrationReadModel(eventStore);
}

RegistrationWriteModel.prototype.reservationFor = function (sessionId) {
  return this.registrationReadModel.reservationsBySessionId()[sessionId];
};

RegistrationWriteModel.prototype.alreadyHasReservation = function (sessionId) {
  return !!this.reservationFor(sessionId);
};

RegistrationWriteModel.prototype.waitinglistReservation = function (sessionId) {
  return this.registrationReadModel.waitinglistReservationsBySessionId()[sessionId];
};

RegistrationWriteModel.prototype.alreadyHasWaitinglistReservation = function (sessionId) {
  return !!this.waitinglistReservation(sessionId);
};

// internal function?
RegistrationWriteModel.prototype.participantEventFor = function (memberId) {
  return this.registrationReadModel.participantEventFor(memberId);
};

RegistrationWriteModel.prototype.isAlreadyRegistered = function (memberId) {
  return this.registrationReadModel.isAlreadyRegistered(memberId);
};

RegistrationWriteModel.prototype.isRegisteredInRoomType = function (memberId, roomType) {
   return this.registrationReadModel.registeredInRoomType(memberId) === roomType;
};

RegistrationWriteModel.prototype.waitinglistParticipantEventFor = function (memberId) {
  return this.registrationReadModel.waitinglistParticipantEventFor(memberId);
};

RegistrationWriteModel.prototype.isAlreadyOnWaitinglist = function (memberId) {
  return this.registrationReadModel.isAlreadyOnWaitinglist(memberId);
};

RegistrationWriteModel.prototype.roomTypesOf = function (memberId) {
  return this.registrationReadModel.roomTypesOf(memberId);
};

/////////////////////////////////////////////////////////////////////////////////////////
RegistrationWriteModel.prototype.updateRegistrationEvents = function (newEvents) {
  this._eventStore.updateRegistrationEvents(newEvents);
};

RegistrationWriteModel.prototype.isFull = function (roomType) {
  return this.registrationReadModel.isFull(roomType);
};

RegistrationWriteModel.prototype.eventStore = function () {
  // persistence needs an id:
  this._eventStore.setId();
  return this._eventStore;
};

module.exports = RegistrationWriteModel;
