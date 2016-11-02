/*eslint no-underscore-dangle: 0*/
'use strict';

const R = require('ramda');

class RoomsWriteModel {
  constructor(eventStore, roomsReadModel, registrationReadModel) {
    this._eventStore = eventStore;
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
    return R.find(pair => pair.participant1Id === memberId || pair.participant2Id === memberId, this._roomsReadModel.roomPairsFor(roomType));
  }

  /////////////////////////////////////////////////////////////////////////////////////////
  eventStore() {
    // persistence needs an id:
    this._eventStore.setId();
    return this._eventStore;
  }
}

module.exports = RoomsWriteModel;
