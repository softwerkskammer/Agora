"use strict";

var request = require('supertest');
var express = require('express');
var sinon = require('sinon').sandbox.create();
var expect = require('chai').expect;

var conf = require('../configureForTest');

var Activity = conf.get('beans').get('activity');
var dummyActivity = new Activity({title: 'title', description: 'description', assignedGroup: 'assignedGroup',
  location: 'location', direction: 'direction', startDate: '01.01.2013', url: 'url'});

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
    allActivities = sinon.stub(activitiesAPI, 'allActivities', function (callback) {callback(null, [dummyActivity]); });
    upcomingActivities = sinon.stub(activitiesAPI, 'upcomingActivities', function (callback) {callback(null, [dummyActivity]); });
    getActivity = sinon.stub(activitiesAPI, 'getActivity', function (url, callback) {callback(null, (url === 'url') ? dummyActivity : null); });
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
    var tmpActivity = new Activity({description: 'description', url: 'url', assignedGroup: 'assignedGroup', location: 'location',
      direction: 'direction', startDate: '2012-11-11', startTime: '10:10', endDate: '2012-11-11', endTime: '20:10' });
    expect(validation.isValidActivity(tmpActivity).length).to.equal(1);
  });

  it('shows the list of activities as retrieved from the store', function (done) {
    request(app)
      .get('/')
      .expect(200)
      .expect(/Aktivitäten/)
      .expect(/href="url"/)
      .expect(/title/, function (err) {
        expect(allActivities.calledOnce).to.be.ok;
        done(err);
      });
  });

  it('shows the details of one activity as retrieved from the store', function (done) {
    var url = 'url';

    request(app)
      .get('/' + url)
      .expect(200)
      .expect(/<small>01.01.2013/)
      .expect(/<h2>title/, function (err) {
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
      .expect(/SUMMARY:title/)
      .end(function (err) { done(err); });
  });

  it('activity is exposed as iCalendar', function (done) {
    var url = 'url';

    request(app)
      .get('/ical/' + url)
      .expect(200)
      .expect('Content-Type', /text\/calendar/)
      .expect('Content-Disposition', /inline; filename=url.ics/)
      .expect(/BEGIN:VCALENDAR/)
      .expect(/SUMMARY:title/)
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
    sinon.stub(activitiesAPI, 'isValidUrl', function (nickname, callback) {
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
    sinon.stub(activitiesAPI, 'isValidUrl', function (nickname, callback) {
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
