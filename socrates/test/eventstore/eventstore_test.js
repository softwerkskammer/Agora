'use strict';

var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTest').get('beans');
var persistence = beans.get('eventstorePersistence');
var store = beans.get('eventstore');

describe('SoCraTesEventStore store', function () {
  var eventStore = {
    id: 'socratesEventStore',
    socratesEvents: [{event: 'EVENT-1'}],
    resourceEvents: [{event: 'EVENT-2'}]
  };

  var getById;

  beforeEach(function () {
    getById = sinon.stub(persistence, 'getById', function (object, callback) {
      return callback(null, eventStore);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('calls persistence.getById for store.getEventStore and transforms the result to a SoCraTesEventStore', function (done) {
    store.getEventStore(function (err, socratesEventStore) {
      expect(socratesEventStore.state.id).to.equal('socratesEventStore');
      expect(getById.calledWith('socratesEventStore')).to.be(true);
      expect(socratesEventStore.state.socratesEvents).to.eql([{event: 'EVENT-1'}]);
      done(err);
    });
  });

  it('returns a SoCraTesEventStore object although the persistence only returns a JS object', function (done) {
    store.getEventStore(function (err, result) {
      expect(result.quotaFor()).to.equal(undefined);
      done(err);
    });
  });

});
