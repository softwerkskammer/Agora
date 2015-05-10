'use strict';

var expect = require('must');

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

  it('can put two participants into a room', function () {
    var roomsInResource = [];
    var rooms = new Rooms(roomsInResource, allKnownMemberIds);

    rooms.add('memberId1', 'memberId2');

    expect(roomsInResource).to.have.length(1);
    expect(roomsInResource[0]).to.eql({participant1: 'memberId1', participant2: 'memberId2'});
  });

  it('does not create a room if one of the participants does not exist', function () {
    var roomsInResource = [];
    var rooms = new Rooms(roomsInResource, allKnownMemberIds);

    rooms.add('memberId1', undefined);
    expect(roomsInResource).to.have.length(0);

    rooms.add(null, 'memberId5');
    expect(roomsInResource).to.have.length(0);

    rooms.add(undefined, null);
    expect(roomsInResource).to.have.length(0);
  });

  it('does not create a room if the two participants are identical', function () {
    var roomsInResource = [];
    var rooms = new Rooms(roomsInResource, allKnownMemberIds);

    rooms.add('memberId1', 'memberId1');
    expect(roomsInResource).to.have.length(0);
  });

  it('does not create a room if one of the participants already is in a room', function () {
    var roomsInResource = [{participant1: 'memberId1', participant2: 'memberId2'}];
    var rooms = new Rooms(roomsInResource, allKnownMemberIds);

    rooms.add('memberId1', 'memberId3');
    expect(roomsInResource).to.have.length(1);
    expect(roomsInResource[0]).to.eql({participant1: 'memberId1', participant2: 'memberId2'});

    rooms.add('memberId4', 'memberId2');
    expect(roomsInResource).to.have.length(1);
    expect(roomsInResource[0]).to.eql({participant1: 'memberId1', participant2: 'memberId2'});

    rooms.add('memberId2', 'memberId1');
    expect(roomsInResource).to.have.length(1);
    expect(roomsInResource[0]).to.eql({participant1: 'memberId1', participant2: 'memberId2'});
  });

  it('does not create a room if one of the participants is not known', function () {
    var roomsInResource = [];
    var rooms = new Rooms(roomsInResource, allKnownMemberIds);

    rooms.add('memberId1', 'unknownMemberId');
    expect(roomsInResource).to.have.length(0);

    rooms.add('unknownMemberId', 'memberId5');
    expect(roomsInResource).to.have.length(0);

    rooms.add('unknownMemberId', 'anotherUnknownMemberId');
    expect(roomsInResource).to.have.length(0);
  });

  it('removes a pair if the members are given in the right order', function () {
    var roomsInResource = [
      {
        participant1: 'memberId1',
        participant2: 'memberId2'
      }, {
        participant1: 'memberId3',
        participant2: 'memberId4'
      }];
    var rooms = new Rooms(roomsInResource, allKnownMemberIds);

    rooms.remove('memberId1', 'memberId2');

    expect(rooms.state).to.have.length(1);
    expect(rooms.state[0].participant1).to.be('memberId3');
    expect(rooms.state[0].participant2).to.be('memberId4');
  });

  it('does not remove a pair if the members are given in the wrong order', function () {
    var roomsInResource = [
      {
        participant1: 'memberId1',
        participant2: 'memberId2'
      }, {
        participant1: 'memberId3',
        participant2: 'memberId4'
      }];
    var rooms = new Rooms(roomsInResource, allKnownMemberIds);

    rooms.remove('memberId2', 'memberId1');

    expect(rooms.state).to.have.length(2);
    expect(rooms.state[0].participant1).to.be('memberId1');
    expect(rooms.state[0].participant2).to.be('memberId2');
    expect(rooms.state[1].participant1).to.be('memberId3');
    expect(rooms.state[1].participant2).to.be('memberId4');
  });



  it('lists those participants that already are in a room', function () {
    var roomsInResource = [{participant1: 'memberId1', participant2: 'memberId2'}];
    var rooms = new Rooms(roomsInResource, allKnownMemberIds);

    var participantsInRoom = rooms.participantsInRoom();

    expect(participantsInRoom).to.eql(['memberId1', 'memberId2']);
  });

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

  it('lists those participants that are not yet in a room', function () {
    var roomsInResource = [{participant1: 'memberId1', participant2: 'memberId2'}];
    var rooms = new Rooms(roomsInResource, allKnownMemberIds);

    var participantsWithoutRoom = rooms.participantsWithoutRoom();

    expect(participantsWithoutRoom).to.eql(['memberId3', 'memberId4', 'memberId5']);
  });

});
