'use strict';

var _ = require('lodash');
var WaitinglistEntry = require('simple-configure').get('beans').get('waitinglistEntry');

function Rooms(roomsObject, allKnownMemberIds) {
  this.state = roomsObject; // this must be *the* object that is referenced by resource.rooms
  this.allKnownMemberIds = allKnownMemberIds;
  return this;
}

Rooms.prototype.add = function (memberId1, memberId2) {
  if (this.allKnownMemberIds.indexOf(memberId1) > -1 && this.allKnownMemberIds.indexOf(memberId2) > -1 && memberId1 !== memberId2) {
    this.state.push({participant1: memberId1, participant2: memberId2});
  }
};

module.exports = Rooms;