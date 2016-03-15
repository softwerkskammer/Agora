/*eslint no-underscore-dangle: 0*/
'use strict';

var R = require('ramda');

var beans = require('simple-configure').get('beans');
var e = beans.get('eventConstants');

function RoomsReadModel(eventStore) {
  this._eventStore = eventStore;

  // read model state:
  this._roomPairsFor = {};
  this._participantsIn = {};
}

var projectRoomPairs = function (roomType, roomPairs, event) {
  if (event.event === e.ROOM_PAIR_WAS_ADDED && event.roomType === roomType) {
    return R.append({participant1Id: event.participant1Id, participant2Id: event.participant2Id}, roomPairs);
  }
  if ((event.event === e.ROOM_PAIR_WAS_REMOVED || event.event === e.ROOM_PAIR_CONTAINING_A_PARTICIPANT_WAS_REMOVED) && event.roomType === roomType) {
    return R.reject(function (pair) {
      return pair.participant1Id === event.participant1Id && pair.participant2Id === event.participant2Id;
    }, roomPairs);
  }

  return roomPairs;
};

RoomsReadModel.prototype.roomPairsFor = function (roomType) {
  if (!this._roomPairsFor[roomType]) {
    this._roomPairsFor[roomType] = R.reduce(R.partial(projectRoomPairs, [roomType]), [], this._eventStore.roomsEvents());
  }

  return this._roomPairsFor[roomType];
};

RoomsReadModel.prototype.isRoomPairIn = function (roomType, participant1Id, participant2Id) {
  return R.find(function (pair) {
    return pair.participant1Id === participant1Id || pair.participant2Id === participant2Id;
  }, this.roomPairsFor(roomType));
};

var projectParticpantsInRoom = function (roomType, participants, event) {
  if (event.event === e.ROOM_PAIR_WAS_ADDED && event.roomType === roomType) {
    return R.append(event.participant2Id, R.append(event.participant1Id, participants));
  }
  if ((event.event === e.ROOM_PAIR_WAS_REMOVED || event.event === e.ROOM_PAIR_CONTAINING_A_PARTICIPANT_WAS_REMOVED) && event.roomType === roomType) {
    return R.reject(function (participant) {
      return participant === event.participant1Id || participant === event.participant2Id;
    }, participants);
  }

  return participants;
};

RoomsReadModel.prototype.participantsInRoom = function (roomType) {
  if (!this._participantsIn[roomType]) {
    this._participantsIn[roomType] = R.reduce(R.partial(projectParticpantsInRoom, [roomType]), [], this._eventStore.roomsEvents());
  }

  return this._participantsIn[roomType];
};

module.exports = RoomsReadModel;
