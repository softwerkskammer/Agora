'use strict';

var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');
var events = beans.get('events');
var GlobalEventStore = beans.get('GlobalEventStore');
var SoCraTesReadModel = beans.get('SoCraTesReadModel');

var singleBedRoom = 'singleBedRoom';
var bedInDouble = 'bedInDouble';

describe('The socrates conference read model', function () {

  var eventStore;
  var readModel;

  beforeEach(function () {
    eventStore = new GlobalEventStore();
    readModel = new SoCraTesReadModel(eventStore);
  });

  it('does not know the quota if it has not been set', function () {
    expect(readModel.quotaFor(singleBedRoom)).to.be(undefined);
  });

  it('determines the quota from the socrates event', function () {
    eventStore.state.socratesEvents = [events.roomQuotaWasSet(singleBedRoom, 100)];

    expect(readModel.quotaFor(singleBedRoom)).to.be(100);
  });

  it('determines the quota from the latest socrates event for the requested room type', function () {
    eventStore.state.socratesEvents = [
      events.roomQuotaWasSet(singleBedRoom, 100),
      events.roomQuotaWasSet(singleBedRoom, 200),
      events.roomQuotaWasSet(bedInDouble, 300)];

    expect(readModel.quotaFor(singleBedRoom)).to.be(200);
    expect(readModel.quotaFor(bedInDouble)).to.be(300);
  });
});

