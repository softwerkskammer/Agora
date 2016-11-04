/*eslint no-underscore-dangle: 0*/
'use strict';

const beans = require('simple-configure').get('beans');
const events = beans.get('events');

class RoomsCommandProcessor {

  constructor(writeModel) {
    this.writeModel = writeModel;
  }

  addParticipantPairFor(roomType, participant1Id, participant2Id) {
    const eventList = [];

    if (!this.writeModel.isParticipantIn(roomType, participant1Id)) {
      eventList.push(events.didNotAddRoomPairBecauseParticipantIsNotInRoomType(roomType, participant1Id));
    }
    if (!this.writeModel.isParticipantIn(roomType, participant2Id)) {
      eventList.push(events.didNotAddRoomPairBecauseParticipantIsNotInRoomType(roomType, participant2Id));
    }
    if (this.writeModel.isInRoom(roomType, participant1Id)) {
      eventList.push(events.didNotAddRoomPairBecauseParticipantIsAlreadyInRoom(roomType, participant1Id));
    }
    if (this.writeModel.isInRoom(roomType, participant2Id)) {
      eventList.push(events.didNotAddRoomPairBecauseParticipantIsAlreadyInRoom(roomType, participant2Id));
    }
    if (participant1Id === participant2Id) {
      eventList.push(events.didNotAddRoomPairBecauseParticipantIsPairedWithThemselves(roomType, participant1Id));
    }

    if (eventList.length === 0) {
      // nothing bad was discovered so far
      eventList.push(events.roomPairWasAdded(roomType, participant1Id, participant2Id));
    }
    return eventList;
  }

  removeParticipantPairFor(roomType, participant1Id, participant2Id) {
    const eventList = [];

    if (!this.writeModel.isParticipantIn(roomType, participant1Id)) {
      eventList.push(events.didNotRemoveRoomPairBecauseParticipantIsNotInRoomType(roomType, participant1Id));
    }
    if (!this.writeModel.isParticipantIn(roomType, participant2Id)) {
      eventList.push(events.didNotRemoveRoomPairBecauseParticipantIsNotInRoomType(roomType, participant2Id));
    }
    if (!this.writeModel.isRoomPairIn(roomType, participant1Id, participant2Id)) {
      eventList.push(events.didNotRemoveRoomPairBecauseThePairDoesNotExistForThisRoomType(roomType, participant1Id, participant2Id));
    }

    if (eventList.length === 0) {
      // nothing bad was discovered so far
      eventList.push(events.roomPairWasRemoved(roomType, participant1Id, participant2Id));
    }
    return eventList;
  }

  removeParticipantPairContaining(roomType, memberId) {
    const eventList = [];

    const pair = this.writeModel.roomPairContaining(roomType, memberId);
    if (pair) {
      eventList.push(events.roomPairContainingAParticipantWasRemoved(roomType, memberId, pair.participant1Id, pair.participant2Id));
    }
    return eventList;
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  url() {
    return this.writeModel.url();
  }
}

module.exports = RoomsCommandProcessor;
