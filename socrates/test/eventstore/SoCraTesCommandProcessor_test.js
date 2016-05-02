/*eslint no-underscore-dangle: 0*/
'use strict';

var expect = require('must-dist');
var R = require('ramda');

var beans = require('../../testutil/configureForTest').get('beans');
var e = beans.get('eventConstants');

var GlobalEventStore = beans.get('GlobalEventStore');
var SoCraTesWriteModel = beans.get('SoCraTesWriteModel');
var SoCraTesCommandProcessor = beans.get('SoCraTesCommandProcessor');

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

  it('creates a new url event, start time event, end time event and room quota events on update', function () {
    // When (issued command)
    const evts = commandHandler.setConferenceDetails({
      url: 'new-socrates',
      startDate: '15/06/2015',
      startTime: '12:30',
      endDate: '10/08/2010',
      endTime: '10:30',
      resources: {
        names: ['single', 'bed_in_double', 'bed_in_junior', 'junior'],
        limits: [100, 200, 300, 400]
      }
    });

    // Then (new events)
    expect(stripTimestamps(evts)).to.eql([
      {event: e.URL_WAS_SET, url: 'new-socrates'},
      {event: e.START_TIME_WAS_SET, startTimeInMillis: 1434364200000},
      {event: e.END_TIME_WAS_SET, endTimeInMillis: 1281429000000},
      {event: e.ROOM_QUOTA_WAS_SET, quota: 100, roomType: 'single'},
      {event: e.ROOM_QUOTA_WAS_SET, quota: 200, roomType: 'bed_in_double'},
      {event: e.ROOM_QUOTA_WAS_SET, quota: 300, roomType: 'bed_in_junior'},
      {event: e.ROOM_QUOTA_WAS_SET, quota: 400, roomType: 'junior'}
    ]);


  });
});

