"use strict";

var request = require('supertest');
var express = require('express');
var sinon = require('sinon').sandbox.create();
var expect = require('chai').expect;

var conf = require('../configureForTest');
var userMock = require('../userMock');

var fieldHelpers = conf.get('beans').get('fieldHelpers');
var Activity = conf.get('beans').get('activity');
var Member = conf.get('beans').get('member');

var emptyActivity = new Activity({title: 'Title of the Activity', description: 'description1', assignedGroup: 'assignedGroup',
  location: 'location1', direction: 'direction1', startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013'), url: 'urlOfTheActivity' });
var activityWithParticipants = new Activity({title: 'Interesting Activity', description: 'description2', assignedGroup: 'assignedGroup',
  location: 'location2', direction: 'direction2', startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013'), url: 'urlForInteresting',
  resources: {default: {_registeredMembers: ['memberId1', 'memberId2']}} });
var activityWithMultipleResources = new Activity({title: 'Interesting Activity', description: 'description2', assignedGroup: 'assignedGroup',
  location: 'location2', direction: 'direction2', startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013'), url: 'urlForMultiple',
  resources: {Einzelzimmer: {_registeredMembers: ['memberId1', 'memberId2']}, Doppelzimmer: {_registeredMembers: ['memberId3', 'memberId4']}} });


var activitiesCoreAPI = conf.get('beans').get('activitiesCoreAPI');
var activitiesAPI = conf.get('beans').get('activitiesAPI');

var groupsAPI = conf.get('beans').get('groupsAPI');
var membersAPI = conf.get('beans').get('membersAPI');
var validation = conf.get('beans').get('validation');
var colors = conf.get('beans').get('colorAPI');

var app = conf.get('beans').get('activitiesApp')(express());

describe('Activity application - on submit -', function () {

  it('rejects an activity with invalid and different url', function (done) {
    sinon.stub(activitiesCoreAPI, 'isValidUrl', function (nickname, callback) {
      callback(null, false);
    });

    var root = express();
    root.use(express.urlencoded());
    root.use('/', app);
    request(root)
      .post('/submit')
      //.send('')
      .send('url=uhu')
      .send('previousUrl=aha')
      .expect(200)
      .expect(/Validation Error/)
      .expect(/Diese URL ist leider nicht verfügbar./, function (err) {
        done(err);
      });
  });

  it('rejects an activity with empty title', function (done) {

    var root = express();
    root.use(express.urlencoded());
    root.use('/', app);
    request(root)
      .post('/submit')
      .send('url=uhu&previousUrl=uhu&location=X&startDate=02.07.2000&startTime=19:00&endDate=02.07.2000&endTime=21:00')
      .expect(200)
      .expect(/Validation Error/)
      .expect(/Titel ist ein Pflichtfeld./, function (err) {
        done(err);
      });
  });

  it('rejects an activity with different but valid url and with empty title', function (done) {
    sinon.stub(activitiesCoreAPI, 'isValidUrl', function (nickname, callback) {
      callback(null, true);
    });

    var root = express();
    root.use(express.urlencoded());
    root.use('/', app);
    request(root)
      .post('/submit')
      .send('url=uhu&previousUrl=uhuPrev&location=X&startDate=02.07.2000&startTime=19:00&endDate=02.07.2000&endTime=21:00')
      .expect(200)
      .expect(/Validation Error/)
      .expect(/Titel ist ein Pflichtfeld./, function (err) {
        done(err);
      });
  });

});