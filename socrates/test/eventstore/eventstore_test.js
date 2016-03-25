'use strict';

var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTest').get('beans');
var persistence = beans.get('eventstorePersistence');
var GlobalEventStore = beans.get('GlobalEventStore');
var store = beans.get('eventstore');

describe('eventstore', function () {
  var eventStore = {
    url: 'socrates-url',
    socratesEvents: [{event: 'EVENT-1'}],
    resourceEvents: [{event: 'EVENT-2'}]
  };

  var getByField;

  beforeEach(function () {
    getByField = sinon.stub(persistence, 'getByField', function (object, callback) {
      return callback(null, eventStore);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('calls persistence.getByField for store.getEventStore and transforms the result to a GlobalEventStore', function (done) {
    store.getEventStore('socrates-url', function (err, globalEventStore) {
      expect(getByField.calledWith({url: 'socrates-url'})).to.be(true);
      expect(globalEventStore.state.url).to.equal('socrates-url');
      expect(globalEventStore.state.socratesEvents).to.eql([{event: 'EVENT-1'}]);
      done(err);
    });
  });

  it('returns a GlobalEventStore object although the persistence only returns a JS object', function (done) {
    store.getEventStore('socrates-url', function (err, globalEventStore) {
      expect(globalEventStore instanceof GlobalEventStore).to.be(true);
      done(err);
    });
  });

});
