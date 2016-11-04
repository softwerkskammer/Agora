'use strict';

const expect = require('must-dist');
const moment = require('moment-timezone');

const beans = require('../../testutil/configureForTest').get('beans');
const events = beans.get('events');
const SoCraTesReadModel = beans.get('SoCraTesReadModel');

const singleBedRoom = 'single';
const bedInDouble = 'bed_in_double';

describe('The SoCraTes read model', () => {

  let listOfEvents;

  beforeEach(() => {
    listOfEvents = [];
  });

  it('reads the latest start and end time from the events', () => {
    listOfEvents = [
      events.startTimeWasSet(moment('2015-12-15T12:30:00+02:00')),
      events.startTimeWasSet(moment('2015-06-15T12:30:00+02:00')),
      events.endTimeWasSet(moment('2015-11-15T12:30:00+02:00')),
      events.endTimeWasSet(moment('2015-08-15T12:30:00+02:00'))
    ];
    const readModel = new SoCraTesReadModel(listOfEvents);

    expect(readModel.startTime().valueOf()).to.eql(moment('2015-06-15T12:30:00+02:00').valueOf());
    expect(readModel.endTime().valueOf()).to.eql(moment('2015-08-15T12:30:00+02:00').valueOf());
  });

  it('does not know the quota if it has not been set', () => {
    const readModel = new SoCraTesReadModel(listOfEvents);
    expect(readModel.quotaFor(singleBedRoom)).to.be(undefined);
  });

  it('determines the quota from the socrates event', () => {
    listOfEvents = [events.roomQuotaWasSet(singleBedRoom, 100)];
    const readModel = new SoCraTesReadModel(listOfEvents);

    expect(readModel.quotaFor(singleBedRoom)).to.be(100);
  });

  it('determines the quota from the latest socrates event for the requested room type', () => {
    listOfEvents = [
      events.roomQuotaWasSet(singleBedRoom, 100),
      events.roomQuotaWasSet(singleBedRoom, 200),
      events.roomQuotaWasSet(bedInDouble, 300)];
    const readModel = new SoCraTesReadModel(listOfEvents);

    expect(readModel.quotaFor(singleBedRoom)).to.be(200);
    expect(readModel.quotaFor(bedInDouble)).to.be(300);
  });
});

