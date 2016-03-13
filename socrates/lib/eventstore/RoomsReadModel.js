/*eslint no-underscore-dangle: 0*/
'use strict';

var R = require('ramda');

var beans = require('simple-configure').get('beans');
var e = beans.get('eventConstants');

function RoomsReadModel(eventStore) {
  this._eventStore = eventStore;

  // read model state:
  this._roomPairsFor = {};
}

var projectRoomPairs = function (roomType, roomPairs, event) {
  if (event.event === e.ROOM_PAIR_WAS_ADDED && event.roomType === roomType) {
    return R.append({participant1: event.participant1Id, participant2: event.participant2Id}, roomPairs);
  }
  if (event.event === e.ROOM_PAIR_WAS_REMOVED && event.roomType === roomType) {
    return R.reject(function (pair) {
      return pair.participant1 === event.participant1Id && pair.participant2 === event.participant2Id;
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
    return pair.participant1 === participant1Id || pair.participant2 === participant2Id;
  }, this.roomPairsFor(roomType));
};

module.exports = RoomsReadModel;
