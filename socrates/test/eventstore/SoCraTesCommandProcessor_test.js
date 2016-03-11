/*eslint no-underscore-dangle: 0*/
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

describe('The SoCraTes command processor', function () {
  var eventStore;
  var commandHandler;

  beforeEach(function () {
    eventStore = new GlobalEventStore();
    commandHandler = new SoCraTesCommandProcessor(new SoCraTesWriteModel(eventStore));
  });

  it('creates a new start time event on update', function () {
    // When (issued command)
    commandHandler._updateStartTime('15/06/2015', '12:30');

    // Then (new events)
    expect(stripTimestamps(eventStore.state.socratesEvents)).to.eql([
      {event: e.START_TIME_WAS_SET, startTimeInMillis: 1434364200000}
    ]);
  });

  it('creates a new end time event on update', function () {
    // When (issued command)
    commandHandler._updateEndTime('10/08/2010', '10:30');

    // Then (new events)
    expect(stripTimestamps(eventStore.state.socratesEvents)).to.eql([
      {event: e.END_TIME_WAS_SET, endTimeInMillis: 1281429000000}
    ]);
  });

  it('creates a new quota event on update', function () {
    // Given (saved events)

    eventStore.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 100)];

    // When (issued command)
    commandHandler._updateRoomQuota(singleBedRoom, 150);

    // Then (new events)
    expect(stripTimestamps(eventStore.state.socratesEvents)).to.eql([
      {event: e.ROOM_QUOTA_WAS_SET, roomType: singleBedRoom, quota: 100},
      {event: e.ROOM_QUOTA_WAS_SET, roomType: singleBedRoom, quota: 150}
    ]);
  });
});

