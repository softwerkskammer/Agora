/*eslint no-underscore-dangle: 0*/
'use strict';

var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');
var events = beans.get('events');
var GlobalEventStore = beans.get('GlobalEventStore');
var RoomsReadModel = beans.get('RoomsReadModel');

var bedInDouble = 'bedInDouble';

describe('The rooms read model', function () {

  var eventStore;
  var readModel;

  beforeEach(function () {
    eventStore = new GlobalEventStore();
    readModel = new RoomsReadModel(eventStore);

    eventStore.state.registrationEvents = [
      events.participantWasRegistered(bedInDouble, 2, 'sessionId1', 'memberId1'),
      events.participantWasRegistered(bedInDouble, 2, 'sessionId2', 'memberId2'),
      events.participantWasRegistered(bedInDouble, 2, 'sessionId3', 'memberId3'),
      events.participantWasRegistered(bedInDouble, 2, 'sessionId4', 'memberId4'),
      events.participantWasRegistered(bedInDouble, 2, 'sessionId5', 'memberId5')
    ];
  });

  it('lists those participants that already are in a room', function () {
    eventStore.state.roomsEvents = [
      events.roomPairWasAdded(bedInDouble, 'memberId1', 'memberId2')
    ];

    var participantsInRoom = readModel.participantsInRoom(bedInDouble);

    expect(participantsInRoom).to.eql(['memberId1', 'memberId2']);
  });


  it('lists those participants that are not yet in a room', function () {
    eventStore.state.roomsEvents = [
      events.roomPairWasAdded(bedInDouble, 'memberId1', 'memberId2')
    ];

    var participantsWithoutRoom = readModel.participantsWithoutRoomIn(bedInDouble);

    expect(participantsWithoutRoom).to.eql(['memberId3', 'memberId4', 'memberId5']);
  });
});
