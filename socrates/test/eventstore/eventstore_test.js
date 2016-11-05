'use strict';

var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTest').get('beans');
var persistence = beans.get('eventstorePersistence');
var GlobalEventStore = beans.get('GlobalEventStore');
var store = beans.get('eventstore');

describe('eventstore', () => {
  var eventStore = {
    url: 'socrates-url',
    events: [{event: 'EVENT-1'}],
    resourceEvents: [{event: 'EVENT-2'}]
  };

  var getByField;

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
      expect(globalEventStore instanceof GlobalEventStore).to.be(true);
      done(err);
    });
  });

});
