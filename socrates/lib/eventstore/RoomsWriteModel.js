/*eslint no-underscore-dangle: 0*/
'use strict';

var R = require('ramda');

function RoomsWriteModel(eventStore, roomsReadModel, registrationReadModel) {
  this._eventStore = eventStore;
  this._roomsReadModel = roomsReadModel;
  this._registrationReadModel = registrationReadModel;
}

RoomsWriteModel.prototype.isParticipantIn = function (roomType, memberId) {
  return this._registrationReadModel.registeredInRoomType(memberId) === roomType;
};

RoomsWriteModel.prototype.isRoomPairIn = function (roomType, participant1Id, participant2Id) {
  return this._roomsReadModel.isRoomPairIn(roomType, participant1Id, participant2Id);
};

RoomsWriteModel.prototype.isInRoom = function (roomType, memberId) {
  return R.contains(memberId, this._roomsReadModel.participantsInRoom(roomType));
};

RoomsWriteModel.prototype.roomPairContaining = function (roomType, memberId) {
  return R.find(function (pair) {
    return pair.participant1Id === memberId || pair.participant2Id === memberId;
  }, this._roomsReadModel.roomPairsFor(roomType));
};

/////////////////////////////////////////////////////////////////////////////////////////
RoomsWriteModel.prototype.updateRoomsEvents = function (newEvents) {
  this._eventStore.updateRoomsEvents(newEvents);
};

RoomsWriteModel.prototype.eventStore = function () {
  // persistence needs an id:
  this._eventStore.setId();
  return this._eventStore;
};

module.exports = RoomsWriteModel;
