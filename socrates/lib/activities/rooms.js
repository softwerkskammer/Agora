'use strict';

var _ = require('lodash');

function Rooms(roomsObject, allKnownMemberIds) {
  this.state = roomsObject; // this must be *the* object that is referenced by resource.rooms
  this.allKnownMemberIds = allKnownMemberIds;
  return this;
}

Rooms.prototype.roomPairsWithMembersFrom = function (memberList) {
  return _.map(this.state, function (roomPair) {
    return {
      participant1: _.find(memberList, function (member) { return member.id() === roomPair.participant1; }),
      participant2: _.find(memberList, function (member) { return member.id() === roomPair.participant2; })
    };
  });
};

module.exports = Rooms;
