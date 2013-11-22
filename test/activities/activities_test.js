"use strict";

var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('chai').expect;

var conf = require('../configureForTest');

var createApp = require('../testHelper')('activitiesApp').createApp;

var beans = conf.get('beans');
var fieldHelpers = beans.get('fieldHelpers');
var Activity = beans.get('activity');
var Member = beans.get('member');
var Group = beans.get('group');

var emptyActivity = new Activity({title: 'Title of the Activity', description: 'description1', assignedGroup: 'groupname',
  location: 'location1', direction: 'direction1', startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013'),
  url: 'urlOfTheActivity', owner: 'owner' });
var activityWithParticipants = new Activity({title: 'Interesting Activity', description: 'description2', assignedGroup: 'groupname',
  location: 'location2', direction: 'direction2', startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013'), url: 'urlForInteresting',
  resources: {default: {_registeredMembers: ['memberId1', 'memberId2']}} });
var activityWithMultipleResources = new Activity({title: 'Interesting Activity', description: 'description2', assignedGroup: 'groupname',
  location: 'location2', direction: 'direction2', startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013'), url: 'urlForMultiple',
  resources: {Einzelzimmer: {_registeredMembers: ['memberId1', 'memberId2']}, Doppelzimmer: {_registeredMembers: ['memberId3', 'memberId4']}} });

var group = new Group({id: "groupname", longName: "Buxtehude"});

var activitiesCoreAPI = beans.get('activitiesCoreAPI');
var activitiesAPI = beans.get('activitiesAPI');

var groupsAPI = beans.get('groupsAPI');
var membersAPI = beans.get('membersAPI');
var colors = beans.get('colorAPI');

describe('Activity application', function () {
  var allActivities;
  var upcomingActivities;
  var getActivity;
  var getGroup;

  beforeEach(function (done) {
    allActivities = sinon.stub(activitiesCoreAPI, 'allActivities', function (callback) {callback(null, [emptyActivity]); });
    upcomingActivities = sinon.stub(activitiesCoreAPI, 'upcomingActivities', function (callback) {callback(null, [emptyActivity]); });
    sinon.stub(activitiesAPI, 'getActivitiesForDisplay', function (fetcher, callback) {
      var enhancedActivity = new Activity({title: 'Title of the Activity', description: 'description1', assignedGroup: 'assignedGroup',
        location: 'location1', direction: 'direction1', startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013'), url: 'urlOfTheActivity' });
      enhancedActivity.colorRGB = '#123456';
      enhancedActivity.groupName = 'The name of the assigned Group';
      callback(null, [enhancedActivity]);
    });
    getActivity = sinon.stub(activitiesCoreAPI, 'getActivity', function (url, callback) {
      callback(null, (url === 'urlOfTheActivity') ? emptyActivity : (url === 'urlForInteresting') ? activityWithParticipants :
        (url === 'urlForMultiple') ? activityWithMultipleResources : null);
    });
    getGroup = sinon.stub(groupsAPI, 'getGroup', function (groupname, callback) { callback(null, group); });
    sinon.stub(colors, 'allColors', function (callback) { callback(null, []); });
    done();
  });

  afterEach(function (done) {
    sinon.restore();
    done();
  });

  it('shows the list of activities', function (done) {
    request(createApp())
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

  it('shows the details of an activity without participants', function (done) {
    sinon.stub(membersAPI, 'getMembersForIds', function (ids, callback) {callback(null, []); });

    request(createApp('guest'))
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
    sinon.stub(membersAPI, 'getMembersForIds', function (ids, callback) {
      callback(null, [
        new Member({id: 'memberId1', nickname: 'nick1', email: 'nick1@b.c'}),
        new Member({id: 'memberId2', nickname: 'nick2', email: 'nick2@b.c'})
      ]);
    });

    request(createApp('guest'))
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
    sinon.stub(membersAPI, 'getMembersForIds', function (ids, callback) {
      callback(null, [
        new Member({id: 'memberId1', nickname: 'participant1', email: "a@b.c"}),
        new Member({id: 'memberId2', nickname: 'participant2', email: "a@b.c"})
      ]);
    });

    request(createApp('memberId3'))
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
    sinon.stub(membersAPI, 'getMembersForIds', function (ids, callback) {
      callback(null, [
        new Member({id: 'memberId1', nickname: 'participant1', email: "a@b.c"}),
        new Member({id: 'memberId2', nickname: 'participant2', email: "a@b.c"})
      ]);
    });

    request(createApp('memberId1'))
      .get('/' + 'urlForInteresting')
      .expect(200)
      .expect(/Bislang haben 2 Mitglieder ihre Teilnahme zugesagt./)
      .expect(/href="unsubscribe\/urlForInteresting\/default" class=".*">Ich kann doch nicht/)
      .expect(/participant1/)
      .expect(/participant2/, function (err) {
        done(err);
      });
  });

  it('shows the registration button for an activity with multiple resources where the current user has booked one resource', function (done) {
    sinon.stub(membersAPI, 'getMembersForIds', function (ids, callback) {
      callback(null, [
        new Member({id: 'memberId1', nickname: 'participant1', email: "a@b.c"}),
        new Member({id: 'memberId2', nickname: 'participant2', email: "a@b.c"}),
        new Member({id: 'memberId3', nickname: 'participant3', email: "a@b.c"}),
        new Member({id: 'memberId4', nickname: 'participant4', email: "a@b.c"})
      ]);
    });

    request(createApp('memberId1'))
      .get('/' + 'urlForMultiple')
      .expect(200)
      .expect(/Bislang haben 4 Mitglieder ihre Teilnahme zugesagt./)
      .expect(/href="unsubscribe\/urlForMultiple\/Einzelzimmer" class=".*">Absagen/)
      .expect(/href="subscribe\/urlForMultiple\/Doppelzimmer" class=".*">Anmelden/)
      .expect(/participant1/)
      .expect(/participant2/)
      .expect(/participant3/)
      .expect(/participant4/, function (err) {
        done(err);
      });
  });

  it('upcoming activities are exposed as iCalendar', function (done) {
    request(createApp())
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

    request(createApp())
      .get('/ical/' + url)
      .expect(200)
      .expect('Content-Type', /text\/calendar/)
      .expect('Content-Disposition', /inline; filename=urlOfTheActivity.ics/)
      .expect(/BEGIN:VCALENDAR/)
      .expect(/SUMMARY:Title of the Activity/)
      .end(function (err) { done(err); });
  });

  it('shows a 404 if the id cannot be found in the store for the detail page', function (done) {
    sinon.stub(membersAPI, 'getMembersForIds', function (ids, callback) {callback(null, []); });
    var link = emptyActivity.id + '4711';

    request(createApp()).get('/' + link).expect(404, function (err) { done(err); });
  });

  it('allows to create a new activity', function (done) {
    sinon.stub(groupsAPI, 'getSubscribedGroupsForUser', function (email, callback) { callback(null, []); });

    // in the test setup anybody can create an activity because the middleware is not plugged in
    request(createApp('dummy'))
      .get('/new')
      .expect(200)
      .expect(/activities/, function (err) {
        done(err);
      });
  });

  it('allows the owner to edit an activity', function (done) {
    sinon.stub(groupsAPI, 'getSubscribedGroupsForUser', function (email, callback) { callback(null, []); });

    request(createApp('owner'))
      .get('/edit/urlOfTheActivity')
      .expect(200)
      .expect(/activities/, function (err) {
        done(err);
      });
  });

  it('disallows a member to edit another user\'s activity', function (done) {
    sinon.stub(groupsAPI, 'getAllAvailableGroups', function (callback) { callback(null, []); });

    request(createApp('owner1'))
      .get('/edit/urlOfTheActivity')
      .expect(302)
      .expect('location', /activities\/urlOfTheActivity/, done);
  });

  it('disallows a guest to edit any user\'s activity', function (done) {
    sinon.stub(groupsAPI, 'getAllAvailableGroups', function (callback) { callback(null, []); });

    request(createApp())
      .get('/edit/urlOfTheActivity')
      .expect(302)
      .expect('location', /activities\/urlOfTheActivity/, done);
  });

  it('offers the owner only his groups to choose from', function (done) {
    var groupA = new Group({id: 'groupA', longName: 'groupA'});
    var groupB = new Group({id: 'groupB', longName: 'groupB'});
    var groupC = new Group({id: 'groupC', longName: 'groupC'});
    sinon.stub(groupsAPI, 'getAllAvailableGroups', function (callback) { callback(null, [groupA, groupB, groupC]); });
    sinon.stub(groupsAPI, 'getSubscribedGroupsForUser', function (email, callback) { callback(null, [groupA, groupB]); });

    request(createApp('owner'))
      .get('/new')
      .expect(200)
      .expect(/groupA/)
      .expect(/groupB/)
      .end(function (err, res) {
        expect(res.text).to.not.contain('groupC');
        done(err);
      });
  });

  it('offers a superuser all groups to choose from', function (done) {
    var groupA = new Group({id: 'groupA', longName: 'groupA'});
    var groupB = new Group({id: 'groupB', longName: 'groupB'});
    var groupC = new Group({id: 'groupC', longName: 'groupC'});
    sinon.stub(groupsAPI, 'getAllAvailableGroups', function (callback) { callback(null, [groupA, groupB, groupC]); });
    sinon.stub(groupsAPI, 'getSubscribedGroupsForUser', function (email, callback) { callback(null, [groupA, groupB]); });

    request(createApp('superuserID'))
      .get('/new')
      .expect(200)
      .expect(/groupA/)
      .expect(/groupB/)
      .expect(/groupC/)
      .end(function (err) {
        done(err);
      });
  });

  it('shows no group name if no groups are available', function (done) {
    getGroup.restore();
    getGroup = sinon.stub(groupsAPI, 'getGroup', function (groupname, callback) { callback(null, null); });

    sinon.stub(membersAPI, 'getMembersForIds', function (ids, callback) { callback(null, []); });

    request(createApp('guest'))
      .get('/urlOfTheActivity')
      .expect(200)
      .end(function (err, res) {
        expect(res.text).to.not.contain('Veranstaltet von der Gruppe');
        done(err);
      });
  });

  it('shows the name of the assigned group if the group exists', function (done) {
    sinon.stub(membersAPI, 'getMembersForIds', function (ids, callback) { callback(null, []); });

    request(createApp('guest'))
      .get('/urlOfTheActivity')
      .expect(200)
      .expect(/Veranstaltet von der Gruppe&nbsp;<a href="\/groups\/groupname">Buxtehude<\/a>/, function (err) {
        done(err);
      });
  });

});
