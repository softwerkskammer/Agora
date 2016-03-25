/*eslint no-underscore-dangle: 0*/
'use strict';

var R = require('ramda');

var beans = require('simple-configure').get('beans');
var RegistrationReadModel = beans.get('RegistrationReadModel');
var RoomsReadModel = beans.get('RoomsReadModel');

function RoomsWriteModel(eventStore) {
  this._eventStore = eventStore;
  this.roomsReadModel = new RoomsReadModel(eventStore);
  this.registrationReadModel = new RegistrationReadModel(eventStore);
}

RoomsWriteModel.prototype.isParticipantIn = function (roomType, participantId) {
  return this.registrationReadModel.registeredInRoomType(participantId) === roomType;
};

RoomsWriteModel.prototype.isRoomPairIn = function (roomType, participant1Id, participant2Id) {
  return this.roomsReadModel.isRoomPairIn(roomType, participant1Id, participant2Id);
};

RoomsWriteModel.prototype.isInRoom = function (roomType, participantId) {
  return R.contains(participantId, this.roomsReadModel.participantsInRoom(roomType));
};

RoomsWriteModel.prototype.roomPairContaining = function (roomType, participantId) {
  return R.find(function (pair) {
    return pair.participant1Id === participantId || pair.participant2Id === participantId;
  }, this.roomsReadModel.roomPairsFor(roomType));
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
