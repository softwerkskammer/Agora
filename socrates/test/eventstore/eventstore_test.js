'use strict';

const expect = require('must-dist');
const sinon = require('sinon').sandbox.create();

const beans = require('../../testutil/configureForTest').get('beans');
const persistence = beans.get('eventstorePersistence');
const GlobalEventStore = beans.get('GlobalEventStore');
const store = beans.get('eventstore');

describe('eventstore', () => {
  const eventStore = {
    url: 'socrates-url',
    events: [{event: 'EVENT-1'}],
    resourceEvents: [{event: 'EVENT-2'}]
  };

  let getByField;

  beforeEach(() => {
    getByField = sinon.stub(persistence, 'getByField', (object, callback) => callback(null, eventStore));
  });

  afterEach(() => {
    sinon.restore();
  });

  it('calls persistence.getByField for store.getEventStore and transforms the result to a GlobalEventStore', done => {
    store.getEventStore('socrates-url', (err, globalEventStore) => {
      expect(getByField.calledWith({url: 'socrates-url'})).to.be(true);
      expect(globalEventStore.state.url).to.equal('socrates-url');
      expect(globalEventStore.state.events).to.eql([{event: 'EVENT-1'}]);
      done(err);
    });
  });

  it('returns a GlobalEventStore object although the persistence only returns a JS object', done => {
    store.getEventStore('socrates-url', (err, globalEventStore) => {
      expect(globalEventStore).to.be.a(GlobalEventStore);
      done(err);
    });
  });

});
