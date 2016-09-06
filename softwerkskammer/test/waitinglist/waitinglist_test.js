'use strict';

var request = require('supertest');
var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTest').get('beans');

var Activity = beans.get('activity');
var activitiesService = beans.get('activitiesService');
var waitinglistService = beans.get('waitinglistService');

var app = require('../../testutil/testHelper')('waitinglistApp').createApp({id: 'superuser'});

describe('Waitinglist application', function () {

  beforeEach(function () {
    sinon.stub(activitiesService, 'getActivityWithGroupAndParticipants', function (url, callback) {
      callback(null, new Activity({url: url, title: 'Activity\'s Title'}));
    });
    sinon.stub(waitinglistService, 'waitinglistFor', function (url, callback) {
      callback(null, []);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('shows the waitinglist as retrieved from the store', function (done) {
    request(app)
      .get('/activity')
      .expect(200)
      .expect(/<h2>Activity\'s Title/)
      .expect(/<small> Warteliste/)
      .expect(/activities\/activity/)
      .expect(/Für die gewählten Wartelisteneinträge /).expect(/title/, done);
  });

});
