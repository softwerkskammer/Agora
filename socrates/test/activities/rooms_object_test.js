'use strict';

var expect = require('must');
var _ = require('lodash');

var beans = require('../../testutil/configureForTest').get('beans');
var Rooms = beans.get('rooms');

describe('Rooms', function () {

  var allKnownMemberIds = ['memberId1', 'memberId2', 'memberId3', 'memberId4', 'memberId5'];

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

    rooms.add('memberId1', 'unknownMemberId');
    expect(roomsInResource).to.have.length(0);

    rooms.add('unknownMemberId', 'memberId5');
    expect(roomsInResource).to.have.length(0);

    rooms.add('unknownMemberId', 'anotherUnknownMemberId');
    expect(roomsInResource).to.have.length(0);
  });

  it('does not create a room if the two participants are identical', function () {
    var roomsInResource = [];
    var rooms = new Rooms(roomsInResource, allKnownMemberIds);

    rooms.add('memberId1', 'memberId1');
    expect(roomsInResource).to.have.length(0);
  });

  it('does not create a room if one of the participants already is in a room', function () {

  });
  it('does not create a room if one of the participants is not known', function () {

  });
  it('lists those participants that already are in a room', function () {

  });
  it('lists those participants that are not yet in a room', function () {

  });

});
