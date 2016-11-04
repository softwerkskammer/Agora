/*eslint no-underscore-dangle: 0*/
'use strict';

const R = require('ramda');

class RoomsWriteModel {
  constructor(url, roomsReadModel, registrationReadModel) {
    this._url = url;
    this._roomsReadModel = roomsReadModel;
    this._registrationReadModel = registrationReadModel;
  }

  isParticipantIn(roomType, memberId) {
    return this._registrationReadModel.registeredInRoomType(memberId) === roomType;
  }

  isRoomPairIn(roomType, participant1Id, participant2Id) {
    return this._roomsReadModel.isRoomPairIn(roomType, participant1Id, participant2Id);
  }

  isInRoom(roomType, memberId) {
    return R.contains(memberId, this._roomsReadModel.participantsInRoom(roomType));
  }

  roomPairContaining(roomType, memberId) {
    return this._roomsReadModel.roomPairsFor(roomType).find(pair => pair.participant1Id === memberId || pair.participant2Id === memberId);
  }

  /////////////////////////////////////////////////////////////////////////////////////////
  url() {
    return this._url;
  }
}

module.exports = RoomsWriteModel;
