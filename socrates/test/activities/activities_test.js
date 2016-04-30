'use strict';

var request = require('supertest');
var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();

var conf = require('../../testutil/configureForTest');
var beans = conf.get('beans');
const cache = conf.get('cache');

var GlobalEventStore = beans.get('GlobalEventStore');
var eventstore = beans.get('eventstore');
var eventstoreService = beans.get('eventstoreService');

var Member = beans.get('member');
var activitiesService = beans.get('activitiesService');
var activitystore = beans.get('activitystore');

var createApp = require('../../testutil/testHelper')('socratesActivitiesApp').createApp;

describe('SoCraTes activities application', function () {
  var appWithSocratesMember = request(createApp({member: new Member({id: 'memberId'})}));

  var saveEventStoreStub;

  beforeEach(function () {
    cache.flushAll();

    const eventStore = new GlobalEventStore({
      url: 'socrates-2015',
      socratesEvents: [],
      registrationEvents: [],
      roomsEvents: []
    });

    saveEventStoreStub = sinon.stub(eventstore, 'saveEventStore', function (store, callback) { callback(); });
    sinon.stub(eventstore, 'getEventStore', function (url, callback) { callback(null, eventStore); });

    sinon.stub(activitiesService, 'getActivityWithGroupAndParticipants', function (url, callback) { callback(); });
    sinon.stub(activitystore, 'saveActivity', function (activity, callback) { callback(); });
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('when submitting the socrates information', function () {

    it('updates the eventstore and the socrates read model', function (done) {
      // first, initialise the cache with a read model:
      eventstoreService.getSoCraTesReadModel('socrates-2015', function () {

        appWithSocratesMember
          .post('/submit')
          .send('url=socrates-2015&previousUrl=socrates-2015')
          .send('startDate=15/06/2015&startTime=12:30&endDate=10/08/2015&endTime=10:30')
          .send('resources[names]=single&resources[names]=bed_in_double&resources[names]=bed_in_junior&resources[names]=junior')
          .send('resources[limits]=100&resources[limits]=200&resources[limits]=300&resources[limits]=400')
          .expect(302)
          .expect('Location', '/registration/')
          .end(function (err) {
            const savedEventStore = saveEventStoreStub.firstCall.args[0];
            expect(savedEventStore.state.socratesEvents.length).to.eql(7);

            const readModel = cache.get('socrates-2015_soCraTesReadModel');
            expect(readModel.quotaFor('single')).to.eql(100);

            done(err);
          });
      });
    });

  });

});
