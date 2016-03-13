/*eslint no-underscore-dangle: 0*/
'use strict';

var beans = require('simple-configure').get('beans');
var events = beans.get('events');

function RoomsCommandProcessor(writeModel) {
  this.writeModel = writeModel;
}

RoomsCommandProcessor.prototype.newParticipantPairFor = function (roomType, participant1Id, participant2Id) {
  var eventList = [];

  if (!this.writeModel.isParticipantIn(roomType, participant1Id)) {
    eventList.push(events.didNotAddNewRoomPairBecauseParticipantIsNotInRoomType(roomType, participant1Id));
  }
  if (!this.writeModel.isParticipantIn(roomType, participant2Id)) {
    eventList.push(events.didNotAddNewRoomPairBecauseParticipantIsNotInRoomType(roomType, participant2Id));
  }

  if (eventList.length === 0) {
    // nothing bad was discovered so far
    eventList.push(events.addedNewRoomPair(roomType, participant1Id, participant2Id));
  }
  this._updateRoomsEvents(eventList);
};

///////////////////////////////////////////////////////////////////////////////////////////////////
RoomsCommandProcessor.prototype._updateRoomsEvents = function (newEvents) {
  if (!(newEvents instanceof Array)) {
    newEvents = [newEvents];
  }
  this.writeModel.updateRoomsEvents(newEvents);
};

RoomsCommandProcessor.prototype.eventStore = function () {
  return this.writeModel.eventStore();
};

module.exports = RoomsCommandProcessor;
