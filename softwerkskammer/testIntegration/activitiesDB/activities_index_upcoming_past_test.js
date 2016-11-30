'use strict';

var moment = require('moment-timezone');

var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');

var beans = require('../../testutil/configureForTestWithDB').get('beans');
var activitystore = beans.get('activitystore');
var persistence = beans.get('activitiesPersistence');
var Activity = beans.get('activity');

var createApp = require('../../testutil/testHelper')('activitiesApp', beans).createApp;

describe('Activity application with DB - shows activities -', function () {

  var tomorrow = moment().add(1, 'days');
  var dayAfterTomorrow = moment().add(2, 'days');
  var yesterday = moment().subtract(1, 'days');
  var dayBeforeYesterday = moment().subtract(2, 'days');

  var futureActivity = new Activity({
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
  var currentActivity = new Activity({
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
  var pastActivity = new Activity({
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

  beforeEach(function (done) { // if this fails, you need to start your mongo DB

    persistence.drop(function () {
      activitystore.saveActivity(futureActivity, function (err) {
        if (err) { done(err); }
        activitystore.saveActivity(currentActivity, function (err1) {
          if (err1) { done(err1); }
          activitystore.saveActivity(pastActivity, function (err2) {
            done(err2);
          });
        });
      });
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('shows only current and future activities as upcoming', function (done) {

    request(createApp())
      .get('/upcoming')
      .expect(200)
      .expect(/Current Activity/)
      .expect(/Future Activity/, function (err, res) {
        expect(res.text).to.not.contain('Past Activity');
        done(err);
      });
  });

  it('shows only current and past activities as past', function (done) {

    request(createApp())
      .get('/past')
      .expect(200)
      .expect(/Current Activity/)
      .expect(/Past Activity/, function (err, res) {
        expect(res.text).to.not.contain('Future Activity');
        done(err);
      });
  });

});
