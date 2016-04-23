'use strict';

var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();

const conf = require('../../testutil/configureForTest');
var beans = conf.get('beans');
var cache = conf.get('cache');
var eventstore = beans.get('eventstore');
var GlobalEventStore = beans.get('GlobalEventStore');
var eventstoreService = beans.get('eventstoreService');

describe('eventstoreService', function () {
  var eventStore = {
    url: 'socrates-url',
    socratesEvents: [{event: 'EVENT-1'}],
    resourceEvents: [{event: 'EVENT-2'}]
  };

  let getEventStore;

  beforeEach(function () {
    cache.flushAll();
    getEventStore = sinon.stub(eventstore, 'getEventStore', function (url, callback) {
      callback(null, new GlobalEventStore(eventStore));
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('calls getEventStore once on startup', function (done) {
    eventstoreService.getSoCraTesReadModel('socrates-url', function (err) {
      expect(getEventStore.callCount).to.be(1);
      expect(getEventStore.calledWith('socrates-url')).to.be(true);
      done(err);
    });
  });

  it('calls getEventStore once even when fetching the model multiple times', function (done) {
    eventstoreService.getSoCraTesReadModel('socrates-url', function (err1) {
      eventstoreService.getSoCraTesReadModel('socrates-url', function (err2) {
        eventstoreService.getSoCraTesReadModel('socrates-url', function (err3) {
          expect(getEventStore.callCount).to.be(1);
          done(err1 || err2 || err3);
        });
      });
    });
  });

});
