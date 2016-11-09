'use strict';

const expect = require('must-dist');
const sinon = require('sinon').sandbox.create();

const conf = require('../../testutil/configureForTest');
const cache = conf.get('cache');
const beans = conf.get('beans');
const roomOptions = beans.get('roomOptions');
const eventstore = beans.get('eventstore');
const GlobalEventStore = beans.get('GlobalEventStore');
const eventstoreService = beans.get('eventstoreService');

describe('eventstoreService', () => {
  const eventStore = {
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

  it('creates a new SoCraTes read model which does not know about url or quotas', () => {
    const readModel = eventstoreService.newSoCraTesReadModel();
    expect(readModel.url()).to.be(undefined);
    roomOptions.allIds().forEach(roomType => {
      expect(readModel.quotaFor(roomType)).to.be(undefined);
    });
  });
});
