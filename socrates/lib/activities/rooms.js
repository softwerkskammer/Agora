'use strict';

var _ = require('lodash');

function Rooms(roomsObject, allKnownMemberIds) {
  this.state = roomsObject; // this must be *the* object that is referenced by resource.rooms
  this.allKnownMemberIds = allKnownMemberIds;
  return this;
}

Rooms.prototype.removePairContaining = function (memberId) {
  var pairIndex = _.findIndex(this.state, function (pair) {
    return pair.participant1 === memberId || pair.participant2 === memberId;
  });
  if (pairIndex > -1) {
    this.state.splice(pairIndex, 1);
  }
};

Rooms.prototype.findRoommateFor = function (memberId) {
  var pairWithMember = _.find(this.state, function (pair) {
    return pair.participant1 === memberId || pair.participant2 === memberId;
  });
  if (pairWithMember) {
    return pairWithMember.participant1 === memberId ? pairWithMember.participant2 : pairWithMember.participant1;
  }
  return undefined;
};

Rooms.prototype.participantsInRoom = function () {
  var participantsInRoom = [];
  participantsInRoom.push(_.pluck(this.state, 'participant1'));
  participantsInRoom.push(_.pluck(this.state, 'participant2'));
  return _.flatten(participantsInRoom);
};

Rooms.prototype.roomPairsWithMembersFrom = function (memberList) {
  return _.map(this.state, function (roomPair) {
    return {
      participant1: _.find(memberList, function (member) { return member.id() === roomPair.participant1; }),
      participant2: _.find(memberList, function (member) { return member.id() === roomPair.participant2; })
    };
  });
};

Rooms.prototype.participantsWithoutRoom = function () {
  var participantsInRoom = this.participantsInRoom();
  return _.filter(this.allKnownMemberIds, function (memberId) {return participantsInRoom.indexOf(memberId) === -1; });
};

module.exports = Rooms;
