'use strict';

const request = require('supertest');
const expect = require('must-dist');
const sinon = require('sinon').sandbox.create();

const conf = require('../../testutil/configureForTest');
const beans = conf.get('beans');
const cache = conf.get('cache');

const GlobalEventStore = beans.get('GlobalEventStore');
const eventstore = beans.get('eventstore');
const eventstoreService = beans.get('eventstoreService');

const Member = beans.get('member');
const activitiesService = beans.get('activitiesService');
const activitystore = beans.get('activitystore');

const createApp = require('../../testutil/testHelper')('socratesActivitiesApp').createApp;

describe('SoCraTes activities application', () => {
  const appWithSocratesMember = request(createApp({member: new Member({id: 'memberId'})}));

  let saveEventStoreStub;

  beforeEach(() => {
    cache.flushAll();

    sinon.stub(activitiesService, 'getActivityWithGroupAndParticipants').callsFake((url, callback) => { callback(); });
    sinon.stub(activitystore, 'saveActivity').callsFake((activity, callback) => { callback(); });

    saveEventStoreStub = sinon.stub(eventstore, 'saveEventStore').callsFake((store, callback) => { callback(); });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('when submitting the socrates information', () => {

    it('creates the eventstore and the socrates read model', done => {

      sinon.stub(eventstore, 'getEventStore').callsFake((url, callback) => callback(null, null));

      appWithSocratesMember
        .post('/submit')
        .send('previousUrl=')
        .send('startDate=15/06/2015&startTime=12:30&endDate=10/08/2015&endTime=10:30')
        .send('resources[names]=single&resources[names]=bed_in_double&resources[names]=bed_in_junior&resources[names]=junior')
        .send('resources[limits]=100&resources[limits]=200&resources[limits]=300&resources[limits]=400')
        .expect(302)
        .expect('Location', '/registration/')
        .end(err => {
          const cachedStore = cache.get('socrates-2015' + '_' + 'globalEventStoreForWriting');
          expect(cachedStore.state.events.length).to.eql(7);
          expect(cachedStore.state.url).to.eql('socrates-2015');

          done(err);
        });
    });

    it('updates the eventstore and the socrates read model', done => {
      sinon.stub(eventstore, 'getEventStore').callsFake((url, callback) => { callback(null, new GlobalEventStore({url: 'socrates-2015', events: [{event: 'EVENT1'}, {event: 'EVENT2'}, {event: 'EVENT3'}]})); });

      // first, initialise the cache with a read model:
      eventstoreService.getSoCraTesReadModel('socrates-2015', () => {

        appWithSocratesMember
          .post('/submit')
          .send('previousUrl=socrates-2015')
          .send('startDate=15/06/2015&startTime=12:30&endDate=10/08/2015&endTime=10:30')
          .send('resources[names]=single&resources[names]=bed_in_double&resources[names]=bed_in_junior&resources[names]=junior')
          .send('resources[limits]=100&resources[limits]=200&resources[limits]=300&resources[limits]=400')
          .expect(302)
          .expect('Location', '/registration/')
          .end(err => {
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

    it('changing the year of an existing SoCraTes is not allowed (and has no effect)', done => {
      sinon.stub(eventstore, 'getEventStore').callsFake((url, callback) => {
        if (url === 'socrates-2014') {
          return callback(null, new GlobalEventStore({url: 'socrates-2014', events: [{event: 'EVENT1'}, {event: 'EVENT2'}, {event: 'EVENT3'}]}));
        }
        return callback(null, null);
      });

      // first, initialise the cache with a read model:
      eventstoreService.getSoCraTesReadModel('socrates-2014', () => {

        appWithSocratesMember
          .post('/submit')
          .send('previousUrl=socrates-2014')
          .send('startDate=15/06/2015&startTime=12:30&endDate=10/08/2015&endTime=10:30')
          .send('resources[names]=single&resources[names]=bed_in_double&resources[names]=bed_in_junior&resources[names]=junior')
          .send('resources[limits]=100&resources[limits]=200&resources[limits]=300&resources[limits]=400')
          .expect(200)
          .expect(/It is impossible to alter the year of an existing SoCraTes conference./)
          .end(err => {
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
