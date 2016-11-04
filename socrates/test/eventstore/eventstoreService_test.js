'use strict';

var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();

const conf = require('../../testutil/configureForTest');
var beans = conf.get('beans');
var cache = conf.get('cache');
var eventstore = beans.get('eventstore');
var GlobalEventStore = beans.get('GlobalEventStore');
var eventstoreService = beans.get('eventstoreService');

describe('eventstoreService', () => {
  var eventStore = {
    url: 'socrates-url',
    events: [{event: 'EVENT-1'}]
  };

  let getEventStore;

  beforeEach(() => {
    cache.flushAll();
    getEventStore = sinon.stub(eventstore, 'getEventStore', (url, callback) => callback(null, new GlobalEventStore(eventStore)));
  });

  afterEach(() => {
    sinon.restore();
  });

  it('calls getEventStore once on startup', done => {
    eventstoreService.getSoCraTesReadModel('socrates-url', function (err) {
      expect(getEventStore.callCount).to.be(1);
      expect(getEventStore.calledWith('socrates-url')).to.be(true);
      done(err);
    });
  });

  it('calls getEventStore once even when fetching the model multiple times', done => {
    eventstoreService.getSoCraTesReadModel('socrates-url', err1 =>
      eventstoreService.getSoCraTesReadModel('socrates-url', err2 =>
        eventstoreService.getSoCraTesReadModel('socrates-url', err3 => {
          expect(getEventStore.callCount).to.be(1);
          done(err1 || err2 || err3);
        })
      )
    );
  });

});
