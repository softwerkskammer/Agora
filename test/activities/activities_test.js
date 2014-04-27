"use strict";

var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must');

var createApp = require('../../testutil/testHelper')('activitiesApp').createApp;

var beans = require('../../testutil/configureForTest').get('beans');
var fieldHelpers = beans.get('fieldHelpers');
var activitystore = beans.get('activitystore');
var Activity = beans.get('activity');
var Member = beans.get('member');
var Group = beans.get('group');

var activitiesAPI = beans.get('activitiesAPI');
var groupsAPI = beans.get('groupsAPI');
var groupsAndMembersAPI = beans.get('groupsAndMembersAPI');
var addonAPI = beans.get('addonAPI');

var member1 = new Member({id: 'memberId1', nickname: 'participant1', email: 'nick1@b.c'});
var member2 = new Member({id: 'memberId2', nickname: 'participant2', email: 'nick2@b.c'});
var member3 = new Member({id: 'memberId3', nickname: 'participant3', email: 'nick3@b.c'});
var member4 = new Member({id: 'memberId4', nickname: 'participant4', email: 'nick4@b.c'});

var group = new Group({id: "groupname", longName: "Buxtehude"});

var emptyActivity = new Activity({title: 'Title of the Activity', description: 'description1', assignedGroup: 'groupname',
  location: 'location1', direction: 'direction1', startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013'),
  url: 'urlOfTheActivity', owner: 'owner' });
emptyActivity.participants = [ ];
emptyActivity.colorRGB = '#123456';
emptyActivity.group = group;

var activityWithParticipants = new Activity({title: 'Interesting Activity', description: 'description2', assignedGroup: 'groupname',
  location: 'location2', direction: 'direction2', startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013'), url: 'urlForInteresting',
  resources: {'default': {_registeredMembers: [
    {memberId: 'memberId1'},
    {memberId: 'memberId2'}
  ],
    _registrationOpen: true }} });
activityWithParticipants.participants = [ member1, member2 ];
activityWithParticipants.colorRGB = '#123456';
activityWithParticipants.group = new Group({id: 'group', longName: 'The name of the assigned Group'});

var activityWithMultipleResources = new Activity({title: 'Interesting Activity', description: 'description2', assignedGroup: 'groupname',
  location: 'location2', direction: 'direction2', startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013'), url: 'urlForMultiple',
  resources: {Einzelzimmer: {_registeredMembers: [
    {memberId: 'memberId1'},
    {memberId: 'memberId2'}
  ]}, Doppelzimmer: {_registeredMembers: [
    {memberId: 'memberId3'},
    {memberId: 'memberId4'}
  ],
    _registrationOpen: true}} });
activityWithMultipleResources.participants = [ member1, member2, member3, member4 ];
activityWithMultipleResources.colorRGB = '#123456';
activityWithMultipleResources.group = new Group({id: 'group', longName: 'The name of the assigned Group'});

describe('Activity application', function () {
  beforeEach(function () {
    sinon.stub(activitystore, 'upcomingActivities', function (callback) {callback(null, [emptyActivity]); });
    sinon.stub(activitiesAPI, 'getActivitiesForDisplay', function (fetcher, callback) {
      callback(null, [emptyActivity]);
    });

    function activityToReturnFor(url) {
      if (url === 'urlOfTheActivity') { return emptyActivity; }
      if (url === 'urlForInteresting') { return activityWithParticipants; }
      if (url === 'urlForMultiple') { return activityWithMultipleResources; }
      return null;
    }

    sinon.stub(activitiesAPI, 'getActivityWithGroupAndParticipants', function (url, callback) {
      callback(null, activityToReturnFor(url));
    });
    sinon.stub(activitystore, 'getActivity', function (url, callback) {
      callback(null, activityToReturnFor(url));
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('shows the list of activities with "webcal:" link', function (done) {
    request(createApp())
      .get('/')
      .expect(200)
      .expect(/Aktivitäten/)
      .expect(/href="\/activities\/urlOfTheActivity"/)
      .expect(/href="webcal:\/\//)
      .expect(/Title of the Activity/)
      .expect(/1\. Januar 2013/)
      .expect(/background-color: #123456/)
      .expect(/href="\/groups\/groupname"/)
      .expect(/Buxtehude/, done);
  });

  it('shows the details of an activity without participants', function (done) {
    request(createApp('guest'))
      .get('/' + 'urlOfTheActivity')
      .expect(200)
      .expect(/<small>1\. Januar 2013/)
      .expect(/<h2>Title of the Activity/)
      .expect(/description1/)
      .expect(/location1/)
      .expect(/direction1/)
      .expect(/script src="https:\/\/maps\.googleapis\.com\/maps\/api\/js\?sensor=false"/)
      .expect(/Bislang gibt es keine Teilnahmezusagen\./, function (err, res) {
        expect(res.text).to.not.contain('Angelegt von');
        done(err);
      });
  });

  it('shows the details of an activity with Owner', function (done) {
    emptyActivity.ownerNickname = 'owner';
    request(createApp('guest'))
      .get('/' + 'urlOfTheActivity')
      .expect(200)
      .expect(/Angelegt von/)
      .expect(/owner/, function (err) {
        delete emptyActivity.ownerNickname;
        done(err);
      });
  });

  it('shows the details of an activity with participants', function (done) {
    request(createApp('guest'))
      .get('/' + 'urlForInteresting')
      .expect(200)
      .expect(/<small>1\. Januar 2013/)
      .expect(/<h2>Interesting Activity/)
      .expect(/description2/)
      .expect(/location2/)
      .expect(/direction2/)
      .expect(/Bislang haben 2 Mitglieder ihre Teilnahme zugesagt\./, done);
  });

  describe('- when registration is open -', function () {

    it('shows the registration button for an activity with participants when a user is logged in who is not participant', function (done) {
      request(createApp('memberId3'))
        .get('/' + 'urlForInteresting')
        .expect(200)
        .expect(/Bislang haben 2 Mitglieder ihre Teilnahme zugesagt\./)
        .expect(/href="subscribe\/urlForInteresting\/default" class="(\S|\s)*">Ich bin dabei!/)
        .expect(/participant1/)
        .expect(/participant2/, done);
    });

    it('shows the registration button for an activity with participants when a user is logged in who already is participant', function (done) {
      request(createApp('memberId1'))
        .get('/' + 'urlForInteresting')
        .expect(200)
        .expect(/Bislang haben 2 Mitglieder ihre Teilnahme zugesagt\./)
        .expect(/href="unsubscribe\/urlForInteresting\/default" class="(\S|\s)*">Ich kann doch nicht/)
        .expect(/participant1/)
        .expect(/participant2/, done);
    });

    it('shows the registration button for an activity with multiple resources where the current user has booked one resource', function (done) {
      request(createApp('memberId1'))
        .get('/' + 'urlForMultiple')
        .expect(200)
        .expect(/Bislang haben 4 Mitglieder ihre Teilnahme zugesagt\./)
        .expect(/href="unsubscribe\/urlForMultiple\/Einzelzimmer" class="(\S|\s)*">Absagen/)
        .expect(/href="subscribe\/urlForMultiple\/Doppelzimmer" class="(\S|\s)*">Anmelden/)
        .expect(/participant1/)
        .expect(/participant2/)
        .expect(/participant3/)
        .expect(/participant4/, done);
    });
  });

  describe('- when registration is not open -', function () {

    it('shows the registration button for an activity with participants when a user is logged in who is not participant', function (done) {
      activityWithParticipants.state.resources['default']._registrationOpen = false;

      request(createApp('memberId3'))
        .get('/' + 'urlForInteresting')
        .expect(200)
        .expect(/Bislang haben 2 Mitglieder ihre Teilnahme zugesagt\./)
        .expect(/participant1/)
        .expect(/participant2/, done);
    });

    it('shows that registration is not possible if registrationClosed and no limit set', function (done) {
      activityWithParticipants.state.resources['default']._registrationOpen = false;

      request(createApp('memberId3'))
        .get('/' + 'urlForInteresting')
        .expect(200)
        .expect(/Anmeldung ist zur Zeit nicht möglich\./, done);
    });

    it('shows that registration is somewhere else if registrationClosed and limit is "0"', function (done) {
      activityWithParticipants.state.resources['default']._registrationOpen = false;
      activityWithParticipants.state.resources['default']._limit = 0;

      request(createApp('memberId3'))
        .get('/' + 'urlForInteresting')
        .expect(200)
        .expect(/Anmeldung ist nicht über die Softwerkskammer möglich\./, done);
    });

    it('shows that the event is full if registrationClosed and some limit set', function (done) {
      activityWithParticipants.state.resources['default']._registrationOpen = false;
      activityWithParticipants.state.resources['default']._limit = 1;

      request(createApp('memberId3'))
        .get('/' + 'urlForInteresting')
        .expect(200)
        .expect(/Alle Plätze sind belegt\./, done);
    });

    it('shows the link to the waitinglist if registrationClosed and some limit set and waitinglist is enabled', function (done) {
      activityWithParticipants.state.resources['default']._registrationOpen = false;
      activityWithParticipants.state.resources['default']._limit = 1;
      activityWithParticipants.state.resources['default']._waitinglist = [];

      request(createApp('memberId3'))
        .get('/' + 'urlForInteresting')
        .expect(200)
        .expect(/Auf die Warteliste/, done);
    });

    it('shows the deregistration button for an activity with participants when a user is logged in who already is participant', function (done) {
      activityWithParticipants.state.resources['default']._registrationOpen = false;

      request(createApp('memberId1'))
        .get('/' + 'urlForInteresting')
        .expect(200)
        .expect(/Bislang haben 2 Mitglieder ihre Teilnahme zugesagt\./)
        .expect(/href="unsubscribe\/urlForInteresting\/default" class="(\S|\s)*">Ich kann doch nicht/)
        .expect(/participant1/)
        .expect(/participant2/, done);
    });

    it('shows the registration button for an activity with multiple resources where the current user has booked one resource', function (done) {
      activityWithMultipleResources.state.resources.Einzelzimmer._registrationOpen = false;
      activityWithMultipleResources.state.resources.Doppelzimmer._registrationOpen = false;

      request(createApp('memberId1'))
        .get('/' + 'urlForMultiple')
        .expect(200)
        .expect(/Bislang haben 4 Mitglieder ihre Teilnahme zugesagt\./)
        .expect(/href="unsubscribe\/urlForMultiple\/Einzelzimmer" class="(\S|\s)*">Absagen/)
        .expect(/Doppelzimmer:<\/label>(\S|\s)*Anmeldung ist zur Zeit nicht möglich\./)
        .expect(/participant1/)
        .expect(/participant2/)
        .expect(/participant3/)
        .expect(/participant4/, done);
    });

    it('shows that registration is not possible if registrationClosed and no limit set', function (done) {
      activityWithMultipleResources.state.resources.Einzelzimmer._registrationOpen = false;
      activityWithMultipleResources.state.resources.Doppelzimmer._registrationOpen = false;

      request(createApp('memberId3'))
        .get('/' + 'urlForMultiple')
        .expect(200)
        .expect(/Anmeldung ist zur Zeit nicht möglich\./, done);
    });

    it('shows that registration is somewhere else if registrationClosed and limit is "0"', function (done) {
      activityWithMultipleResources.state.resources.Einzelzimmer._registrationOpen = false;
      activityWithMultipleResources.state.resources.Doppelzimmer._registrationOpen = false;
      activityWithMultipleResources.state.resources.Einzelzimmer._limit = 0;
      activityWithMultipleResources.state.resources.Doppelzimmer._limit = 0;

      request(createApp('memberId3'))
        .get('/' + 'urlForMultiple')
        .expect(200)
        .expect(/Anmeldung ist nicht über die Softwerkskammer möglich\./, done);
    });

    it('shows that the event is full if registrationClosed and some limit set', function (done) {
      activityWithMultipleResources.state.resources.Einzelzimmer._registrationOpen = false;
      activityWithMultipleResources.state.resources.Doppelzimmer._registrationOpen = false;
      activityWithMultipleResources.state.resources.Einzelzimmer._limit = 2;
      activityWithMultipleResources.state.resources.Doppelzimmer._limit = 2;

      request(createApp('memberId3'))
        .get('/' + 'urlForMultiple')
        .expect(200)
        .expect(/Alle Plätze sind belegt\./, done);
    });

    it('shows the link to the waitinglist if registrationClosed and some limit set and waitinglist is enabled', function (done) {
      activityWithMultipleResources.state.resources.Einzelzimmer._registrationOpen = false;
      activityWithMultipleResources.state.resources.Doppelzimmer._registrationOpen = false;
      activityWithMultipleResources.state.resources.Einzelzimmer._limit = 2;
      activityWithMultipleResources.state.resources.Doppelzimmer._limit = 2;
      activityWithMultipleResources.state.resources.Einzelzimmer._waitinglist = [];

      request(createApp('memberId3'))
        .get('/' + 'urlForMultiple')
        .expect(200)
        .expect(/addToWaitinglist\/urlForMultiple\/Einzelzimmer(\S|\s)*Auf die Warteliste/, done);
    });

  });

  it('upcoming activities are exposed as iCalendar', function (done) {
    request(createApp())
      .get('/ical')
      .expect(200)
      .expect('Content-Type', /text\/calendar/)
      .expect('Content-Disposition', /inline; filename=events\.ics/)
      .expect(/BEGIN:VCALENDAR/)
      .expect(/SUMMARY:Title of the Activity/)
      .end(done);
  });

  it('activity is exposed as iCalendar', function (done) {
    request(createApp())
      .get('/ical/' + 'urlOfTheActivity')
      .expect(200)
      .expect('Content-Type', /text\/calendar/)
      .expect('Content-Disposition', /inline; filename=urlOfTheActivity\.ics/)
      .expect(/BEGIN:VCALENDAR/)
      .expect(/SUMMARY:Title of the Activity/)
      .end(done);
  });

  it('shows a 404 if the id cannot be found in the store for the detail page', function (done) {
    request(createApp()).get('/' + emptyActivity.id + '4711').expect(404, function (err) { done(err); });
  });

  it('allows to create a new activity', function (done) {
    sinon.stub(groupsAPI, 'getSubscribedGroupsForUser', function (email, callback) { callback(null, []); });

    // in the test setup anybody can create an activity because the middleware is not plugged in
    request(createApp('dummy'))
      .get('/new')
      .expect(200)
      .expect(/activities/, done);
  });

  it('allows the owner to edit an activity', function (done) {
    sinon.stub(groupsAPI, 'getSubscribedGroupsForUser', function (email, callback) { callback(null, []); });

    request(createApp('owner'))
      .get('/edit/urlOfTheActivity')
      .expect(200)
      .expect(/activities/, done);
  });

  it('disallows a member to edit another user\'s activity', function (done) {
    request(createApp('owner1'))
      .get('/edit/urlOfTheActivity')
      .expect(302)
      .expect('location', /activities\/urlOfTheActivity/, done);
  });

  it('disallows a guest to edit any user\'s activity', function (done) {
    request(createApp())
      .get('/edit/urlOfTheActivity')
      .expect(302)
      .expect('location', /activities\/urlOfTheActivity/, done);
  });

  it('allows the owner to manage an activity\'s addons', function (done) {
    sinon.stub(groupsAndMembersAPI, 'addMembersToGroup', function (group, callback) {
      group.members = [];
      callback(null);
    });

    request(createApp('owner'))
      .get('/addons/urlOfTheActivity')
      .expect(200)
      .expect(/activities/, done);
  });

  it('disallows a member to manage another user\'s activity\'s addons', function (done) {
    request(createApp('owner1'))
      .get('/addons/urlOfTheActivity')
      .expect(302)
      .expect('location', /activities\/urlOfTheActivity/, done);
  });

  it('disallows a guest to manage any addons', function (done) {
    request(createApp())
      .get('/addons/urlOfTheActivity')
      .expect(302)
      .expect('location', /activities\/urlOfTheActivity/, done);
  });

  it('allows the owner to mark payments', function (done) {
    sinon.stub(addonAPI, 'submitPaymentReceived', function (url, nick, callback) { callback(null); });
    request(createApp('owner'))
      .get('/paymentReceived/urlOfTheActivity/someUser')
      .expect(200)
      .expect(/[0-9][0-9]\.[0-9][0-9]\.[0-9][0-9][0-9][0-9]/, done);
  });

  it('disallows a member to mark another user\'s activity\'s payments', function (done) {
    request(createApp('owner1'))
      .get('/paymentReceived/urlOfTheActivity/someUser')
      .expect(302)
      .expect('location', /activities\/urlOfTheActivity/, done);
  });

  it('disallows a guest to mark any payments', function (done) {
    request(createApp())
      .get('/paymentReceived/urlOfTheActivity/someUser')
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
      .end(done);
  });

  it('shows no group name if no groups are available', function (done) {
    var backupGroup = emptyActivity.group;
    emptyActivity.group = undefined;
    request(createApp('guest'))
      .get('/urlOfTheActivity')
      .expect(200)
      .end(function (err, res) {
        expect(res.text).to.not.contain('Veranstaltet von der Gruppe');
        emptyActivity.group = backupGroup;
        done(err);
      });
  });

  it('shows the name of the assigned group if the group exists', function (done) {
    request(createApp('guest'))
      .get('/urlOfTheActivity')
      .expect(200)
      .expect(/Veranstaltet von der Gruppe&nbsp;<a href="\/groups\/groupname">Buxtehude<\/a>/, done);
  });

  it('shows all activities that take place at the day of the global code retreat', function (done) {
    request(createApp())
      .get('/gdcr')
      .expect(200)
      .expect(/1 Coderetreats/, done);
  });

});
