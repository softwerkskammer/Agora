'use strict';

var expect = require('must-dist');
var R = require('ramda');

var beans = require('../../testutil/configureForTest').get('beans');
var events = beans.get('events');
var e = beans.get('eventConstants');

var GlobalEventStore = beans.get('GlobalEventStore');
var SoCraTesWriteModel = beans.get('SoCraTesWriteModel');
var SoCraTesCommandProcessor = beans.get('SoCraTesCommandProcessor');

var singleBedRoom = 'singleBedRoom';

function stripTimestamps(someEvents) {
  return R.map(function (event) {
    var newEvent = R.clone(event);
    delete newEvent.timestamp;
    return newEvent;
  }, someEvents);
}

describe('The socrates conference command handler', function () {
  var eventStore;
  var commandHandler;

  beforeEach(function () {
    eventStore = new GlobalEventStore();
    commandHandler = new SoCraTesCommandProcessor(new SoCraTesWriteModel(eventStore));
  });

  it('changes the quota', function () {
    // Given (saved events)

    eventStore.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 100)];

    // When (issued command)
    commandHandler.updateRoomQuota(singleBedRoom, 150);

    // Then (new events)
    expect(stripTimestamps(eventStore.state.socratesEvents)).to.eql([
      {event: e.ROOM_QUOTA_WAS_SET, roomType: singleBedRoom, quota: 100},
      {event: e.ROOM_QUOTA_WAS_SET, roomType: singleBedRoom, quota: 150}
    ]);
  });
});

