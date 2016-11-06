/*eslint no-underscore-dangle: 0*/
'use strict';

class RegistrationWriteModel {

  constructor(registrationReadModel) {
    this._registrationReadModel = registrationReadModel;
  }

  waitinglistReservation(sessionId) {
    return this._registrationReadModel.waitinglistReservationsBySessionId()[sessionId];
  }

  alreadyHasWaitinglistReservation(sessionId) {
    return !!this.waitinglistReservation(sessionId);
  }

  // internal function?
  participantEventFor(memberId) {
    return this._registrationReadModel.participantEventFor(memberId);
  }

  isAlreadyRegistered(memberId) {
    return this._registrationReadModel.isAlreadyRegistered(memberId);
  }

  isRegisteredInRoomType(memberId, roomType) {
    return this._registrationReadModel.registeredInRoomType(memberId) === roomType;
  }

  waitinglistParticipantEventFor(memberId) {
    return this._registrationReadModel.waitinglistParticipantEventFor(memberId);
  }

  isAlreadyOnWaitinglist(memberId) {
    return this._registrationReadModel.isAlreadyOnWaitinglist(memberId);
  }

  roomTypesOf(memberId) {
    return this._registrationReadModel.roomTypesOf(memberId);
  }
}

module.exports = RegistrationWriteModel;
