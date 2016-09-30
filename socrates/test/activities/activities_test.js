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

    sinon.stub(activitiesService, 'getActivityWithGroupAndParticipants', function (url, callback) { callback(); });
    sinon.stub(activitystore, 'saveActivity', function (activity, callback) { callback(); });

    saveEventStoreStub = sinon.stub(eventstore, 'saveEventStore', function (store, callback) { callback(); });
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('when submitting the socrates information', function () {

    it('creates the eventstore and the socrates read model', function (done) {

      sinon.stub(eventstore, 'getEventStore', (url, callback) => callback(null, null));

      appWithSocratesMember
        .post('/submit')
        .send('previousUrl=')
        .send('startDate=15/06/2015&startTime=12:30&endDate=10/08/2015&endTime=10:30')
        .send('resources[names]=single&resources[names]=bed_in_double&resources[names]=bed_in_junior&resources[names]=junior')
        .send('resources[limits]=100&resources[limits]=200&resources[limits]=300&resources[limits]=400')
        .expect(302)
        .expect('Location', '/registration/')
        .end(function (err) {
          const cachedStore = cache.get('socrates-2015' + '_' + 'globalEventStoreForWriting');
          expect(cachedStore.state.events.length).to.eql(7);
          expect(cachedStore.state.url).to.eql('socrates-2015');

          done(err);
        });
    });

    it('updates the eventstore and the socrates read model', function (done) {
      sinon.stub(eventstore, 'getEventStore', function (url, callback) { callback(null, new GlobalEventStore({url: 'socrates-2015', events: [{event: 'EVENT1'}, {event: 'EVENT2'}, {event: 'EVENT3'}]})); });

      // first, initialise the cache with a read model:
      eventstoreService.getSoCraTesReadModel('socrates-2015', function () {

        appWithSocratesMember
          .post('/submit')
          .send('previousUrl=socrates-2015')
          .send('startDate=15/06/2015&startTime=12:30&endDate=10/08/2015&endTime=10:30')
          .send('resources[names]=single&resources[names]=bed_in_double&resources[names]=bed_in_junior&resources[names]=junior')
          .send('resources[limits]=100&resources[limits]=200&resources[limits]=300&resources[limits]=400')
          .expect(302)
          .expect('Location', '/registration/')
          .end(function (err) {
            const cachedStore = cache.get('socrates-2015' + '_' + 'globalEventStoreForWriting');
            expect(cachedStore.state.events.length).to.eql(10);
            expect(cachedStore.state.url).to.eql('socrates-2015');

            const savedEventStore = saveEventStoreStub.firstCall.args[0];
            expect(savedEventStore.state.events.length).to.eql(10);
            expect(savedEventStore.state.url).to.eql('socrates-2015');

            const readModel = cache.get('socrates-2015_soCraTesReadModel');
            expect(readModel.quotaFor('single')).to.eql(100);

            done(err);
          });
      });
    });

    it('changing the year of an existing SoCraTes is not allowed (and has no effect)', function (done) {
      sinon.stub(eventstore, 'getEventStore', function (url, callback) {
        if (url === 'socrates-2014') {
          return callback(null, new GlobalEventStore({url: 'socrates-2014', events: [{event: 'EVENT1'}, {event: 'EVENT2'}, {event: 'EVENT3'}]}));
        }
        return callback(null, null);
      });

      // first, initialise the cache with a read model:
      eventstoreService.getSoCraTesReadModel('socrates-2014', function () {

        appWithSocratesMember
          .post('/submit')
          .send('previousUrl=socrates-2014')
          .send('startDate=15/06/2015&startTime=12:30&endDate=10/08/2015&endTime=10:30')
          .send('resources[names]=single&resources[names]=bed_in_double&resources[names]=bed_in_junior&resources[names]=junior')
          .send('resources[limits]=100&resources[limits]=200&resources[limits]=300&resources[limits]=400')
          .expect(200)
          .expect(/It is impossible to alter the year of an existing SoCraTes conference./)
          .end(function (err) {
            const cachedStore = cache.get('socrates-2014' + '_' + 'globalEventStoreForWriting');
            expect(cachedStore.state.events.length).to.eql(3);
            expect(cachedStore.state.url).to.eql('socrates-2014');

            expect(cache.get('socrates-2015' + '_' + 'globalEventStoreForWriting')).to.not.exist();

            expect(saveEventStoreStub.called).to.be(false);
            done(err);
          });
      });
    });

  });

});
