"use strict";

var request = require('supertest');
var express = require('express');
var sinon = require('sinon').sandbox.create();
var expect = require('chai').expect;

var conf = require('../configureForTest');
var userMock = require('../userMock');

var Activity = conf.get('beans').get('activity');
var Member = conf.get('beans').get('member');
var emptyActivity = new Activity().fillFromDB({title: 'Title of the Activity', description: 'description1', assignedGroup: 'assignedGroup',
  location: 'location1', direction: 'direction1', startDate: '01.01.2013', url: 'urlOfTheActivity' });
var activityWithParticipants = new Activity().fillFromDB({title: 'Interesting Activity', description: 'description2', assignedGroup: 'assignedGroup',
  location: 'location2', direction: 'direction2', startDate: '01.01.2013', url: 'urlForInteresting',
  resources: {default: {_registeredMembers: ['memberId1', 'memberId2']}} });
var activityWithMultipleResources = new Activity().fillFromDB({title: 'Interesting Activity', description: 'description2', assignedGroup: 'assignedGroup',
  location: 'location2', direction: 'direction2', startDate: '01.01.2013', url: 'urlForMultiple',
  resources: {Einzelzimmer: {_registeredMembers: ['memberId1', 'memberId2']}, Doppelzimmer: {_registeredMembers: ['memberId3', 'memberId4']}} });


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
    allActivities = sinon.stub(activitiesCoreAPI, 'allActivities', function (callback) {callback(null, [emptyActivity]); });
    upcomingActivities = sinon.stub(activitiesCoreAPI, 'upcomingActivities', function (callback) {callback(null, [emptyActivity]); });
    sinon.stub(activitiesAPI, 'getActivitiesForDisplay', function (fetcher, callback) {
      var enhancedActivity = new Activity().copyFrom(emptyActivity);
      enhancedActivity.colorRGB = '#123456';
      enhancedActivity.groupName = 'The name of the assigned Group';
      callback(null, [enhancedActivity]);
    });
    getActivity = sinon.stub(activitiesCoreAPI, 'getActivity', function (url, callback) {
      callback(null, (url === 'urlOfTheActivity') ? emptyActivity : (url === 'urlForInteresting') ? activityWithParticipants :
        (url === 'urlForMultiple') ? activityWithMultipleResources : null);
    });
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

  it('shows the list of activities', function (done) {
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

  it('shows the details of one activity without participants', function (done) {
    sinon.stub(membersAPI, 'allMembers', function (callback) {callback(null, []); });

    request(app)
      .get('/' + 'urlOfTheActivity')
      .expect(200)
      .expect(/<small>01.01.2013/)
      .expect(/<h2>Title of the Activity/)
      .expect(/description1/)
      .expect(/location1/)
      .expect(/direction1/)
      .expect(/Bislang gibt es keine Teinahmezusagen./, function (err) {
        done(err);
      });
  });

  it('shows the details of an activity with participants', function (done) {
    sinon.stub(membersAPI, 'allMembers', function (callback) {
      callback(null, [
        {id: 'memberId1'},
        {id: 'memberId2'}
      ]);
    });

    request(app)
      .get('/' + 'urlForInteresting')
      .expect(200)
      .expect(/<small>01.01.2013/)
      .expect(/<h2>Interesting Activity/)
      .expect(/description2/)
      .expect(/location2/)
      .expect(/direction2/)
      .expect(/Bislang haben 2 Mitglieder ihre Teilnahme zugesagt./, function (err) {
        done(err);
      });
  });

  it('shows the registration button for an activity with participants when a user is logged in who is not participant', function (done) {
    sinon.stub(membersAPI, 'allMembers', function (callback) {
      callback(null, [
        new Member({id: 'memberId1', nickname: 'participant1', email: "a@b.c"}),
        new Member({id: 'memberId2', nickname: 'participant2', email: "a@b.c"})
      ]);
    });

    var root = express();
    root.use(userMock({member: {id: 'memberId3'}}));
    root.use('/', app);
    request(root)
      .get('/' + 'urlForInteresting')
      .expect(200)
      .expect(/Bislang haben 2 Mitglieder ihre Teilnahme zugesagt./)
      .expect(/href="subscribe\/urlForInteresting\/default" class=".*">Ich bin dabei!/)
      .expect(/participant1/)
      .expect(/participant2/, function (err) {
        done(err);
      });
  });


  it('shows the registration button for an activity with participants when a user is logged in who already is participant', function (done) {
    sinon.stub(membersAPI, 'allMembers', function (callback) {
      callback(null, [
        new Member({id: 'memberId1', nickname: 'participant1', email: "a@b.c"}),
        new Member({id: 'memberId2', nickname: 'participant2', email: "a@b.c"})
      ]);
    });

    var name = userMock({member: {id: 'memberId1'}});

    var root = express();
    root.use(name);
    root.use('/', app);
    request(root)
      .get('/' + 'urlForInteresting')
      .expect(200)
      .expect(/Bislang haben 2 Mitglieder ihre Teilnahme zugesagt./)
      .expect(/href="unsubscribe\/urlForInteresting\/default" class=".*">Ich kann doch nicht/)
      .expect(/participant1/)
      .expect(/participant2/, function (err) {
        done(err);
      });
  });

  it('shows the registration button for an activity multiple resources where the current user has booked one resource', function (done) {
    sinon.stub(membersAPI, 'allMembers', function (callback) {
      callback(null, [
        new Member({id: 'memberId1', nickname: 'participant1', email: "a@b.c"}),
        new Member({id: 'memberId2', nickname: 'participant2', email: "a@b.c"}),
        new Member({id: 'memberId3', nickname: 'participant3', email: "a@b.c"}),
        new Member({id: 'memberId4', nickname: 'participant4', email: "a@b.c"})
      ]);
    });

    var name = userMock({member: {id: 'memberId1'}});

    var root = express();
    root.use(name);
    root.use('/', app);
    request(root)
      .get('/' + 'urlForMultiple')
      .expect(200)
      .expect(/Bislang haben 4 Mitglieder ihre Teilnahme zugesagt./)
      .expect(/href="unsubscribe\/urlForMultiple\/Einzelzimmer" class=".*">Ich kann doch nicht/)
      .expect(/href="subscribe\/urlForMultiple\/Doppelzimmer" class=".*">Ich bin dabei!/)
      .expect(/participant1/)
      .expect(/participant2/)
      .expect(/participant3/)
      .expect(/participant4/, function (err) {
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
    sinon.stub(membersAPI, 'allMembers', function (callback) {callback(null, []); });
    var link = emptyActivity.id + '4711';

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
