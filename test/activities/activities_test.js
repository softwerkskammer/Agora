"use strict";

var request = require('supertest');
var express = require('express');
var sinon = require('sinon').sandbox.create();
var expect = require('chai').expect;

var conf = require('../configureForTest');

var Activity = conf.get('beans').get('activity');
var dummyActivity = new Activity().fillFromDB({title: 'Title of the Activity', description: 'description', assignedGroup: 'assignedGroup',
  location: 'location', direction: 'direction', startDate: '01.01.2013', url: 'urlOfTheActivity' });

var activitiesCoreAPI = conf.get('beans').get('activitiesCoreAPI');
var activitiesAPI = conf.get('beans').get('activitiesAPI');

var groupsAPI = conf.get('beans').get('groupsAPI');
var membersAPI = conf.get('beans').get('membersAPI');
var validation = conf.get('beans').get('validation');
var colors = conf.get('beans').get('colorAPI');

var app = conf.get('beans').get('activitiesApp')(express());

describe('Activity application', function () {
  var allActivities,
    upcomingActivities,
    getActivity;

  beforeEach(function (done) {
    allActivities = sinon.stub(activitiesCoreAPI, 'allActivities', function (callback) {callback(null, [dummyActivity]); });
    upcomingActivities = sinon.stub(activitiesCoreAPI, 'upcomingActivities', function (callback) {callback(null, [dummyActivity]); });
    sinon.stub(activitiesAPI, 'getActivitiesForDisplay', function (fetcher, callback) {
      var enhancedActivity = new Activity().copyFrom(dummyActivity);
      enhancedActivity.colorRGB = '#123456';
      enhancedActivity.groupName = 'The name of the assigned Group';
      callback(null, [enhancedActivity]);
    });
    getActivity = sinon.stub(activitiesCoreAPI, 'getActivity', function (url, callback) {callback(null, (url === 'urlOfTheActivity') ? dummyActivity : null); });
    sinon.stub(membersAPI, 'allMembers', function (callback) {callback(null, []); });
    sinon.stub(groupsAPI, 'getAllAvailableGroups', function (callback) { callback(null, []); });
    sinon.stub(colors, 'allColors', function (callback) { callback(null, []); });
    done();
  });

  afterEach(function (done) {
    sinon.restore();
    done();
  });

  it('object is not valid, if the title is not filled', function () {
    var tmpActivity = new Activity().fillFromDB({description: 'description', url: 'url', assignedGroup: 'assignedGroup', location: 'location',
      direction: 'direction', startDate: '2012-11-11', startTime: '10:10', endDate: '2012-11-11', endTime: '20:10' });
    expect(validation.isValidActivity(tmpActivity).length).to.equal(1);
  });

  it('shows the list of activities as retrieved from the store', function (done) {
    request(app)
      .get('/')
      .expect(200)
      .expect(/Aktivitäten/)
      .expect(/href="urlOfTheActivity"/)
      .expect(/Title of the Activity/)
      .expect(/01.01.2013/)
      .expect(/background-color: #123456/)
      .expect(/href="\/groups\/assignedGroup"/)
      .expect(/The name of the assigned Group/, function (err) {
        done(err);
      });
  });

  it('shows the details of one activity as retrieved from the store', function (done) {
    var url = 'urlOfTheActivity';

    request(app)
      .get('/' + url)
      .expect(200)
      .expect(/<small>01.01.2013/)
      .expect(/<h2>Title of the Activity/, function (err) {
        expect(getActivity.calledWith(url)).to.be.true;
        done(err);
      });
  });

  it('upcoming activities are exposed as iCalendar', function (done) {
    request(app)
      .get('/ical')
      .expect(200)
      .expect('Content-Type', /text\/calendar/)
      .expect('Content-Disposition', /inline; filename=events.ics/)
      .expect(/BEGIN:VCALENDAR/)
      .expect(/SUMMARY:Title of the Activity/)
      .end(function (err) { done(err); });
  });

  it('activity is exposed as iCalendar', function (done) {
    var url = 'urlOfTheActivity';

    request(app)
      .get('/ical/' + url)
      .expect(200)
      .expect('Content-Type', /text\/calendar/)
      .expect('Content-Disposition', /inline; filename=urlOfTheActivity.ics/)
      .expect(/BEGIN:VCALENDAR/)
      .expect(/SUMMARY:Title of the Activity/)
      .end(function (err) { done(err); });
  });


  it('shows a 404 if the id cannot be found in the store for the detail page', function (done) {
    var link = dummyActivity.id + '4711';

    request(app).get('/' + link).expect(404, function (err) { done(err); });
  });

  it('allows to create a new activity', function (done) {
    request(app)
      .get('/new')
      .expect(200)
      .expect(/activities/, function (err) {
        done(err);
      });
  });

  it('rejects an activity with invalid and different url on submit', function (done) {
    sinon.stub(activitiesCoreAPI, 'isValidUrl', function (nickname, callback) {
      callback(null, false);
    });

    var root = express();
    root.use(express.bodyParser());
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

  it('rejects an activity with empty title on submit', function (done) {

    var root = express();
    root.use(express.bodyParser());
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

  it('rejects an activity with different but valid url and with empty title on submit', function (done) {
    sinon.stub(activitiesCoreAPI, 'isValidUrl', function (nickname, callback) {
      callback(null, true);
    });

    var root = express();
    root.use(express.bodyParser());
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
