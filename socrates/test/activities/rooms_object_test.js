'use strict';

var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');
var Rooms = beans.get('rooms');
var Member = beans.get('member');

describe('Rooms', function () {

  var allKnownMemberIds = ['memberId1', 'memberId2', 'memberId3', 'memberId4', 'memberId5'];
  var allKnownMembers = [
    new Member({id: 'memberId1'}),
    new Member({id: 'memberId2'}),
    new Member({id: 'memberId3'}),
    new Member({id: 'memberId4'}),
    new Member({id: 'memberId5'})
  ];


  it('lists the room pairs', function () {
    var roomsInResource = [
      {
        participant1: 'memberId1',
        participant2: 'memberId2'
      }, {
        participant1: 'memberId3',
        participant2: 'memberId4'
      }];
    var rooms = new Rooms(roomsInResource, allKnownMemberIds);

    var roomPairs = rooms.roomPairsWithMembersFrom(allKnownMembers);

    expect(roomPairs).to.have.length(2);
    expect(roomPairs[0].participant1.id()).to.be('memberId1');
    expect(roomPairs[0].participant2.id()).to.be('memberId2');
    expect(roomPairs[1].participant1.id()).to.be('memberId3');
    expect(roomPairs[1].participant2.id()).to.be('memberId4');
  });

});
