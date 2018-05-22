'use strict';

const moment = require('moment-timezone');

const request = require('supertest');
const sinon = require('sinon').createSandbox();
const expect = require('must-dist');

const beans = require('../../testutil/configureForTestWithDB').get('beans');
const activitystore = beans.get('activitystore');
const persistence = beans.get('activitiesPersistence');
const Activity = beans.get('activity');

const createApp = require('../../testutil/testHelper')('activitiesApp', beans).createApp;

describe('Activity application with DB - shows activities -', () => {

  const tomorrow = moment().add(1, 'days');
  const dayAfterTomorrow = moment().add(2, 'days');
  const yesterday = moment().subtract(1, 'days');
  const dayBeforeYesterday = moment().subtract(2, 'days');

  const futureActivity = new Activity({
    id: 'futureActivity',
    title: 'Future Activity',
    description: 'description1',
    assignedGroup: 'groupname',
    location: 'location1',
    direction: 'direction1',
    startUnix: tomorrow.unix(),
    endUnix: dayAfterTomorrow.unix(),
    url: 'url_future',
    owner: 'owner',
    resources: {Veranstaltung: {_registeredMembers: [], _registrationOpen: true}},
    version: 1
  });
  const currentActivity = new Activity({
    id: 'currentActivity',
    title: 'Current Activity',
    description: 'description1',
    assignedGroup: 'groupname',
    location: 'location1',
    direction: 'direction1',
    startUnix: yesterday.unix(),
    endUnix: tomorrow.unix(),
    url: 'url_current',
    owner: 'owner',
    resources: {Veranstaltung: {_registeredMembers: [], _registrationOpen: true}},
    version: 1
  });
  const pastActivity = new Activity({
    id: 'pastActivity',
    title: 'Past Activity',
    description: 'description1',
    assignedGroup: 'groupname',
    location: 'location1',
    direction: 'direction1',
    startUnix: dayBeforeYesterday.unix(),
    endUnix: yesterday.unix(),
    url: 'url_past',
    owner: 'owner',
    resources: {Veranstaltung: {_registeredMembers: [], _registrationOpen: true}},
    version: 1
  });

  beforeEach(done => { // if this fails, you need to start your mongo DB

    persistence.drop(() => {
      activitystore.saveActivity(futureActivity, err => {
        if (err) { done(err); }
        activitystore.saveActivity(currentActivity, err1 => {
          if (err1) { done(err1); }
          activitystore.saveActivity(pastActivity, err2 => {
            done(err2);
          });
        });
      });
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('shows only current and future activities as upcoming', done => {

    request(createApp())
      .get('/upcoming')
      .expect(200)
      .expect(/Current Activity/)
      .expect(/Future Activity/, (err, res) => {
        expect(res.text).to.not.contain('Past Activity');
        done(err);
      });
  });

  it('shows only current and past activities as past', done => {

    request(createApp())
      .get('/past')
      .expect(200)
      .expect(/Current Activity/)
      .expect(/Past Activity/, (err, res) => {
        expect(res.text).to.not.contain('Future Activity');
        done(err);
      });
  });

});
