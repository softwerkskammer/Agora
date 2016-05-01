'use strict';

var expect = require('must-dist');
var moment = require('moment-timezone');

var beans = require('../../testutil/configureForTest').get('beans');
var events = beans.get('events');
var GlobalEventStore = beans.get('GlobalEventStore');
var SoCraTesReadModel = beans.get('SoCraTesReadModel');

var singleBedRoom = 'single';
var bedInDouble = 'bed_in_double';

describe('The SoCraTes read model', function () {

  var eventStore;

  beforeEach(function () {
    eventStore = new GlobalEventStore();
  });

  it('reads the latest start and end time from the events', function () {
    eventStore.state.socratesEvents = [
      events.startTimeWasSet(moment('2015-12-15T12:30:00+02:00')),
      events.startTimeWasSet(moment('2015-06-15T12:30:00+02:00')),
      events.endTimeWasSet(moment('2015-11-15T12:30:00+02:00')),
      events.endTimeWasSet(moment('2015-08-15T12:30:00+02:00'))
    ];
    const readModel = new SoCraTesReadModel(eventStore);

    expect(readModel.startTime().valueOf()).to.eql(moment('2015-06-15T12:30:00+02:00').valueOf());
    expect(readModel.endTime().valueOf()).to.eql(moment('2015-08-15T12:30:00+02:00').valueOf());
  });

  it('does not know the quota if it has not been set', function () {
    const readModel = new SoCraTesReadModel(eventStore);
    expect(readModel.quotaFor(singleBedRoom)).to.be(undefined);
  });

  it('determines the quota from the socrates event', function () {
    eventStore.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 100)];
    const readModel = new SoCraTesReadModel(eventStore);

    expect(readModel.quotaFor(singleBedRoom)).to.be(100);
  });

  it('determines the quota from the latest socrates event for the requested room type', function () {
    eventStore.state.socratesEvents = [
      events.roomQuotaWasSet(singleBedRoom, 100),
      events.roomQuotaWasSet(singleBedRoom, 200),
      events.roomQuotaWasSet(bedInDouble, 300)];
    const readModel = new SoCraTesReadModel(eventStore);

    expect(readModel.quotaFor(singleBedRoom)).to.be(200);
    expect(readModel.quotaFor(bedInDouble)).to.be(300);
  });
});

