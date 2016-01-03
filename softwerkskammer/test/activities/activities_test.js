'use strict';

var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');
var _ = require('lodash');
var moment = require('moment-timezone');

var chado = require('chado');
var cb = chado.callback;
var assume = chado.assume;

var createApp = require('../../testutil/testHelper')('activitiesApp').createApp;

var beans = require('../../testutil/configureForTest').get('beans');
var fieldHelpers = beans.get('fieldHelpers');
var activitystore = beans.get('activitystore');
var Activity = beans.get('activity');
var Member = beans.get('member');
var Group = beans.get('group');

var activitiesService = beans.get('activitiesService');
var groupsService = beans.get('groupsService');
var memberstore = beans.get('memberstore');

var member1 = new Member({
  id: 'memberId1',
  nickname: 'participant1',
  email: 'nick1@b.c',
  firstname: 'Firstname1',
  lastname: 'Lastname1'
});
var member2 = new Member({
  id: 'memberId2',
  nickname: 'participant2',
  email: 'nick2@b.c',
  firstname: 'Firstname2',
  lastname: 'Lastname2'
});
var member3 = new Member({
  id: 'memberId3',
  nickname: 'participant3',
  email: 'nick3@b.c',
  firstname: 'Firstname3',
  lastname: 'Lastname3'
});
var member4 = new Member({
  id: 'memberId4',
  nickname: 'participant4',
  email: 'nick4@b.c',
  firstname: 'Firstname4',
  lastname: 'Lastname4'
});

var group = new Group({id: 'groupname', longName: 'Buxtehude'});

var activityWithParticipants = new Activity({
  title: 'Interesting Activity',
  description: 'description2',
  assignedGroup: 'groupname',
  location: 'location2',
  direction: 'direction2',
  startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013'),
  url: 'urlForInteresting',
  resources: {
    'default': {
      _registeredMembers: [
        {memberId: 'memberId1'},
        {memberId: 'memberId2'}
      ],
      _registrationOpen: true
    }
  }
});
activityWithParticipants.participants = [member1, member2];
activityWithParticipants.colorRGB = '#123456';
activityWithParticipants.group = new Group({id: 'group', longName: 'The name of the assigned Group'});

var activityWithMultipleResources = new Activity({
  title: 'Interesting Activity',
  description: 'description2',
  assignedGroup: 'groupname',
  location: 'location2',
  direction: 'direction2',
  startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013'),
  url: 'urlForMultiple',
  resources: {
    Einzelzimmer: {
      _registeredMembers: [
        {memberId: 'memberId1'},
        {memberId: 'memberId2'}
      ]
    },
    Doppelzimmer: {
      _registeredMembers: [
        {memberId: 'memberId3'},
        {memberId: 'memberId4'}
      ],
      _registrationOpen: true
    }
  }
});
activityWithMultipleResources.participants = [member1, member2, member3, member4];
activityWithMultipleResources.colorRGB = '#123456';
activityWithMultipleResources.group = new Group({id: 'group', longName: 'The name of the assigned Group'});

var activityWithEditors = new Activity({
  title: 'Activity with Editors',
  description: 'description5',
  assignedGroup: 'groupname5',
  location: 'location5',
  direction: 'direction5',
  startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013'),
  url: 'urlForEditors',
  owner: 'memberId4',
  editorIds: ['memberId1', 'memberId3'],
  resources: {
    'default': {
      _registeredMembers: [
        {memberId: 'memberId1'},
        {memberId: 'memberId2'},
        {memberId: 'memberId3'},
        {memberId: 'memberId4'}
      ],
      _registrationOpen: true
    }
  }
});
activityWithEditors.participants = [member1, member2, member3, member4];
activityWithEditors.colorRGB = '#123456';
activityWithEditors.group = new Group({id: 'group', longName: 'The name of the group with editors'});
activityWithEditors.ownerNickname = 'participant4';

describe('Activity application', function () {
  var emptyActivity;

  beforeEach(function () {
    emptyActivity = new Activity({
      title: 'Title of the Activity',
      url: 'urlOfTheActivity',
      assignedGroup: 'groupname',
      owner: 'ownerId'
    });
    sinon.stub(activitystore, 'upcomingActivities', function (callback) {callback(null, [emptyActivity]); });
    sinon.stub(activitiesService, 'getActivitiesForDisplay', function (fetcher, callback) {
      callback(null, [emptyActivity]);
    });
    sinon.stub(memberstore, 'getMembersForIds', function (ids, callback) {
      var members = _.map(ids, function (id) { return id === 'memberId1' ? member1 : (id === 'memberId2' ? member2 : (id === 'memberId3' ? member3 : (id === 'memberId4' ? member4 : undefined))); });
      callback(null, members);
    });

    function activityToReturnFor(url) {
      if (url === 'urlOfTheActivity') { return emptyActivity; }
      if (url === 'urlForInteresting') { return activityWithParticipants; }
      if (url === 'urlForMultiple') { return activityWithMultipleResources; }
      if (url === 'urlForEditors') { return activityWithEditors; }
      return null;
    }

    sinon.stub(activitiesService, 'getActivityWithGroupAndParticipants', function (url, callback) {
      callback(null, activityToReturnFor(url));
    });
    sinon.stub(activitystore, 'getActivity', function (url, callback) {
      callback(null, activityToReturnFor(url));
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('shows enriched activities when in detail', function (done) {
    chado.createDouble('activitiesService', activitiesService);
    var expectedActivity = new Activity({
      title: 'Title of the Activity',
      url: 'urlOfTheActivity',
      assignedGroup: 'groupname',
      owner: 'ownerId'
    });
    expectedActivity.group = group;
    expectedActivity.participants = [member1, member2];
    expectedActivity.ownerNickname = 'owner';

    assume(activitiesService)
      .canHandle('getActivityWithGroupAndParticipants')
      .withArgs('urlOfTheActivity', cb)
      .andCallsCallbackWith(null, expectedActivity);

    request(createApp({member: member1}))
      .get('/' + 'urlOfTheActivity')
      .expect(200)
      .expect(/<h2>Title of the Activity/)
      .expect(/Bislang haben 2 Mitglieder ihre Teilnahme zugesagt\./, function (err) {
        chado.reset();
        done(err);
      });
  });

  it('shows the list of activities with "webcal:" link', function (done) {
    emptyActivity.colorRGB = '#123456';
    emptyActivity.group = group;
    emptyActivity.state.startUnix = fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013');
    request(createApp())
      .get('/')
      .expect(200)
      .expect(/Aktivitäten/)
      .expect(/\/activities\/urlOfTheActivity"/)
      .expect(/href="webcal:\/\//)
      .expect(/Title of the Activity/)
      .expect(/1\. Januar 2013/)
      .expect(/background-color: #123456/)
      .expect(/href="\/groups\/groupname"/)
      .expect(/Buxtehude/, done);
  });

  it('shows the details of an activity without participants', function (done) {
    emptyActivity.participants = [];
    emptyActivity.state.startUnix = fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013');
    emptyActivity.state.direction = 'direction1';
    emptyActivity.state.location = 'location1';
    emptyActivity.state.description = 'description1';
    request(createApp({member: member1}))
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
    emptyActivity.group = group;
    emptyActivity.participants = [];
    emptyActivity.ownerNickname = 'owner';
    request(createApp({member: member1}))
      .get('/' + 'urlOfTheActivity')
      .expect(200)
      .expect(/Angelegt von/)
      .expect(/owner/, function (err) {
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
      request(createApp({member: member3}))
        .get('/' + 'urlForInteresting')
        .expect(200)
        .expect(/Bislang haben 2 Mitglieder ihre Teilnahme zugesagt\./)
        .expect(/action="subscribe"/)
        .expect(/input type="hidden" name="url" value="urlForInteresting"/)
        .expect(/input type="hidden" name="resource" value="default"/)
        .expect(/type="submit" class="btn btn-primary">Ich bin dabei!/)
        .expect(/participant1/)
        .expect(/participant2/, done);
    });

    it('shows the registration button for an activity with participants when a user is logged in who already is participant', function (done) {
      request(createApp({member: member1}))
        .get('/' + 'urlForInteresting')
        .expect(200)
        .expect(/Bislang haben 2 Mitglieder ihre Teilnahme zugesagt\./)
        .expect(/action="unsubscribe"/)
        .expect(/input type="hidden" name="url" value="urlForInteresting"/)
        .expect(/input type="hidden" name="resource" value="default"/)
        .expect(/type="submit" class="btn btn-default">Ich kann doch nicht/)
        .expect(/participant1/)
        .expect(/participant2/, done);
    });

    it('shows the registration button for an activity with multiple resources where the current user has booked one resource', function (done) {
      request(createApp({member: member1}))
        .get('/' + 'urlForMultiple')
        .expect(200)
        .expect(/Bislang haben 4 Mitglieder ihre Teilnahme zugesagt\./)
        .expect(/action="unsubscribe"/)
        .expect(/input type="hidden" name="url" value="urlForMultiple"/)
        .expect(/input type="hidden" name="resource" value="Einzelzimmer"/)
        .expect(/type="submit" class="btn btn-default">Absagen/)
        .expect(/action="subscribe"/)
        .expect(/input type="hidden" name="url" value="urlForMultiple"/)
        .expect(/input type="hidden" name="resource" value="Doppelzimmer"/)
        .expect(/type="submit" class="btn btn-primary">Anmelden/)
        .expect(/participant1/)
        .expect(/participant2/)
        .expect(/participant3/)
        .expect(/participant4/, done);
    });
  });

  describe('- when registration is not open -', function () {
    /* eslint no-underscore-dangle: 0 */
    it('shows the registration button for an activity with participants when a user is logged in who is not participant', function (done) {
      activityWithParticipants.state.resources.default._registrationOpen = false;

      request(createApp({member: member3}))
        .get('/' + 'urlForInteresting')
        .expect(200)
        .expect(/Bislang haben 2 Mitglieder ihre Teilnahme zugesagt\./)
        .expect(/participant1/)
        .expect(/participant2/, done);
    });

    it('shows that registration is not possible if registrationClosed and no limit set', function (done) {
      activityWithParticipants.state.resources.default._registrationOpen = false;

      request(createApp({member: member3}))
        .get('/' + 'urlForInteresting')
        .expect(200)
        .expect(/Anmeldung ist zur Zeit nicht möglich\./, done);
    });

    it('shows that registration is somewhere else if registrationClosed and limit is "0"', function (done) {
      activityWithParticipants.state.resources.default._registrationOpen = false;
      activityWithParticipants.state.resources.default._limit = 0;

      request(createApp({member: member3}))
        .get('/' + 'urlForInteresting')
        .expect(200)
        .expect(/Anmeldung ist nicht über die Softwerkskammer möglich\./, done);
    });

    it('shows that the event is full if registrationClosed and some limit set', function (done) {
      activityWithParticipants.state.resources.default._registrationOpen = false;
      activityWithParticipants.state.resources.default._limit = 1;

      request(createApp({member: member3}))
        .get('/' + 'urlForInteresting')
        .expect(200)
        .expect(/Alle Plätze sind belegt\./, done);
    });

    it('shows the link to the waitinglist if registrationClosed and some limit set and waitinglist is enabled', function (done) {
      activityWithParticipants.state.resources.default._registrationOpen = false;
      activityWithParticipants.state.resources.default._limit = 1;
      activityWithParticipants.state.resources.default._waitinglist = [];

      request(createApp({member: member3}))
        .get('/' + 'urlForInteresting')
        .expect(200)
        .expect(/Auf die Warteliste/, done);
    });

    it('allows to leave the waitinglist if member is on waitinglist', function (done) {
      activityWithParticipants.state.resources.default._registrationOpen = false;
      activityWithParticipants.state.resources.default._limit = 1;
      activityWithParticipants.state.resources.default._waitinglist = [{
        _memberId: 'memberId3'
      }];

      request(createApp({member: member3}))
        .get('/' + 'urlForInteresting')
        .expect(200)
        .expect(/Warteliste verlassen/, done);
    });

    it('shows the subscription link if waitinglist participant is entitled to subscribe', function (done) {
      activityWithParticipants.state.resources.default._registrationOpen = false;
      activityWithParticipants.state.resources.default._limit = 1;
      activityWithParticipants.state.resources.default._waitinglist = [{
        _memberId: 'memberId3',
        _registrationValidUntil: moment().add(1, 'days')
      }];

      request(createApp({member: member3}))
        .get('/' + 'urlForInteresting')
        .expect(200)
        .expect(/Ich bin dabei!/, done);
    });

    it('shows the deregistration button for an activity with participants when a user is logged in who already is participant', function (done) {
      activityWithParticipants.state.resources.default._registrationOpen = false;

      request(createApp({member: member1}))
        .get('/' + 'urlForInteresting')
        .expect(200)
        .expect(/Bislang haben 2 Mitglieder ihre Teilnahme zugesagt\./)
        .expect(/action="unsubscribe"/)
        .expect(/input type="hidden" name="url" value="urlForInteresting"/)
        .expect(/input type="hidden" name="resource" value="default"/)
        .expect(/type="submit" class="btn btn-default">Ich kann doch nicht/)
        .expect(/participant1/)
        .expect(/participant2/, done);
    });

    it('shows the registration button for an activity with multiple resources where the current user has booked one resource', function (done) {
      activityWithMultipleResources.state.resources.Einzelzimmer._registrationOpen = false;
      activityWithMultipleResources.state.resources.Doppelzimmer._registrationOpen = false;

      request(createApp({member: member1}))
        .get('/' + 'urlForMultiple')
        .expect(200)
        .expect(/Bislang haben 4 Mitglieder ihre Teilnahme zugesagt\./)
        .expect(/action="unsubscribe"/)
        .expect(/input type="hidden" name="url" value="urlForMultiple"/)
        .expect(/input type="hidden" name="resource" value="Einzelzimmer"/)
        .expect(/type="submit" class="btn btn-default">Absagen/)
        .expect(/Doppelzimmer:<\/label>(\S|\s)*Anmeldung ist zur Zeit nicht möglich\./)
        .expect(/participant1/)
        .expect(/participant2/)
        .expect(/participant3/)
        .expect(/participant4/, done);
    });

    it('shows that registration is not possible if registrationClosed and no limit set', function (done) {
      activityWithMultipleResources.state.resources.Einzelzimmer._registrationOpen = false;
      activityWithMultipleResources.state.resources.Doppelzimmer._registrationOpen = false;

      request(createApp({member: member3}))
        .get('/' + 'urlForMultiple')
        .expect(200)
        .expect(/Anmeldung ist zur Zeit nicht möglich\./, done);
    });

    it('shows that registration is somewhere else if registrationClosed and limit is "0"', function (done) {
      activityWithMultipleResources.state.resources.Einzelzimmer._registrationOpen = false;
      activityWithMultipleResources.state.resources.Doppelzimmer._registrationOpen = false;
      activityWithMultipleResources.state.resources.Einzelzimmer._limit = 0;
      activityWithMultipleResources.state.resources.Doppelzimmer._limit = 0;

      request(createApp({member: member3}))
        .get('/' + 'urlForMultiple')
        .expect(200)
        .expect(/Anmeldung ist nicht über die Softwerkskammer möglich\./, done);
    });

    it('shows that the event is full if registrationClosed and some limit set', function (done) {
      activityWithMultipleResources.state.resources.Einzelzimmer._registrationOpen = false;
      activityWithMultipleResources.state.resources.Doppelzimmer._registrationOpen = false;
      activityWithMultipleResources.state.resources.Einzelzimmer._limit = 2;
      activityWithMultipleResources.state.resources.Doppelzimmer._limit = 2;

      request(createApp({member: member3}))
        .get('/' + 'urlForMultiple')
        .expect(200)
        .expect(/Alle Plätze sind belegt\./, done);
    });

    it('shows the number of participants if the total limit is greater than 0', function (done) {
      emptyActivity.participants = [];
      emptyActivity.state.resources.default = {_registrationOpen: false, _limit: 1};

      request(createApp({member: member3}))
        .get('/' + 'urlOfTheActivity')
        .expect(200)
        .expect(/Bislang gibt es keine Teilnahmezusagen\./, done);
    });

    it('does not show the number of participants if the total limit is 0', function (done) {
      emptyActivity.participants = [];
      emptyActivity.state.resources.default = {_registrationOpen: false, _limit: 0};

      request(createApp({member: member3}))
        .get('/' + 'urlOfTheActivity')
        .expect(200)
        .expect(function (res) {
          expect(res.text).to.not.contain('Bislang gibt es keine Teilnahmezusagen.');
        })
        .end(done);
    });

    it('shows the link to the waitinglist if registrationClosed and some limit set and waitinglist is enabled for multiple resources', function (done) {
      activityWithMultipleResources.state.resources.Einzelzimmer._registrationOpen = false;
      activityWithMultipleResources.state.resources.Doppelzimmer._registrationOpen = false;
      activityWithMultipleResources.state.resources.Einzelzimmer._limit = 2;
      activityWithMultipleResources.state.resources.Doppelzimmer._limit = 2;
      activityWithMultipleResources.state.resources.Einzelzimmer._waitinglist = [];

      request(createApp({member: member3}))
        .get('/' + 'urlForMultiple')
        .expect(200)
        .expect(/action="addToWaitinglist"/)
        .expect(/input type="hidden" name="url" value="urlForMultiple"/)
        .expect(/input type="hidden" name="resource" value="Einzelzimmer"/)
        .expect(/type="submit" class="btn btn-primary">Auf die Warteliste!/, done);
    });

  });

  it('upcoming activities are exposed as iCalendar', function (done) {
    emptyActivity.state.location = 'location1';
    emptyActivity.state.description = 'description1';

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
    emptyActivity.state.location = 'location1';
    emptyActivity.state.description = 'description1';

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
    request(createApp())
      .get('/' + emptyActivity.url() + '4711')
      .expect(404, done);
  });

  it('allows to create a new activity', function (done) {
    sinon.stub(groupsService, 'getSubscribedGroupsForUser', function (email, callback) { callback(null, []); });

    // in the test setup anybody can create an activity because the middleware is not plugged in
    request(createApp({member: member1}))
      .get('/new')
      .expect(200)
      .expect(/activities/, done);
  });

  it('allows the owner to edit an activity', function (done) {
    sinon.stub(groupsService, 'getSubscribedGroupsForUser', function (email, callback) { callback(null, []); });

    request(createApp({id: 'ownerId'}))
      .get('/edit/urlOfTheActivity')
      .expect(200)
      .expect(/activities/, done);
  });

  it('disallows a member to edit another user\'s activity', function (done) {
    request(createApp({id: 'owner1'}))
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

  it('offers the owner only his groups to choose from', function (done) {
    var groupA = new Group({id: 'groupA', longName: 'groupA', type: 'Themengruppe'});
    var groupB = new Group({id: 'groupB', longName: 'groupB', type: 'Themengruppe'});
    var groupC = new Group({id: 'groupC', longName: 'groupC', type: 'Themengruppe'});
    sinon.stub(groupsService, 'getAllAvailableGroups', function (callback) { callback(null, [groupA, groupB, groupC]); });
    sinon.stub(groupsService, 'getSubscribedGroupsForUser', function (email, callback) { callback(null, [groupA, groupB]); });

    request(createApp({id: 'owner'}))
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
    sinon.stub(groupsService, 'getAllAvailableGroups', function (callback) { callback(null, [groupA, groupB, groupC]); });

    request(createApp({id: 'superuserID'}))
      .get('/new')
      .expect(200)
      .expect(/groupA/)
      .expect(/groupB/)
      .expect(/groupC/)
      .end(done);
  });

  it('shows a superuser all groups in the order of appearance, no matter whether they are regional or thematic groups', function (done) {
    var groupA = new Group({id: 'groupA', longName: 'groupA', type: 'Themengruppe'});
    var groupB = new Group({id: 'groupB', longName: 'groupB', type: 'Themengruppe'});
    var groupC = new Group({id: 'groupC', longName: 'groupC', type: 'Regionalgruppe'});
    sinon.stub(groupsService, 'getAllAvailableGroups', function (callback) { callback(null, [groupA, groupB, groupC]); });

    request(createApp({id: 'superuserID'}))
      .get('/new')
      .expect(200)
      .end(function (err, res) {
        expect(res.text).to.contain('groupA');
        expect(res.text.indexOf('groupA')).to.be.below(res.text.indexOf('groupB'));
        expect(res.text.indexOf('groupB')).to.be.below(res.text.indexOf('groupC'));
        done(err);
      });
  });

  it('shows regional groups first on activity creation for regular users', function (done) {
    var groupA = new Group({id: 'groupA', longName: 'groupA', type: 'Themengruppe'});
    var groupB = new Group({id: 'groupB', longName: 'groupB', type: 'Themengruppe'});
    var groupC = new Group({id: 'groupC', longName: 'groupC', type: 'Regionalgruppe'});
    sinon.stub(groupsService, 'getSubscribedGroupsForUser', function (email, callback) { callback(null, [groupA, groupB, groupC]); });

    request(createApp({id: 'owner'}))
      .get('/new')
      .expect(200)
      .end(function (err, res) {
        expect(res.text).to.contain('groupC');
        expect(res.text.indexOf('groupC')).to.be.below(res.text.indexOf('groupA'));
        expect(res.text.indexOf('groupA')).to.be.below(res.text.indexOf('groupB'));
        done(err);
      });
  });

  it('shows regional groups first on activity editing for regular users', function (done) {
    var groupA = new Group({id: 'groupA', longName: 'groupA', type: 'Themengruppe'});
    var groupB = new Group({id: 'groupB', longName: 'groupB', type: 'Themengruppe'});
    var groupC = new Group({id: 'groupC', longName: 'groupC', type: 'Regionalgruppe'});
    sinon.stub(groupsService, 'getSubscribedGroupsForUser', function (email, callback) { callback(null, [groupA, groupB, groupC]); });

    request(createApp({id: 'ownerId'}))
      .get('/edit/urlOfTheActivity')
      .expect(200)
      .end(function (err, res) {
        expect(res.text).to.contain('groupC');
        expect(res.text.indexOf('groupC')).to.be.below(res.text.indexOf('groupA'));
        expect(res.text.indexOf('groupA')).to.be.below(res.text.indexOf('groupB'));
        done(err);
      });
  });

  it('shows no group name if no groups are available', function (done) {
    emptyActivity.participants = [];
    request(createApp('guest'))
      .get('/urlOfTheActivity')
      .expect(200)
      .end(function (err, res) {
        expect(res.text).to.not.contain('Veranstaltet von der Gruppe');
        done(err);
      });
  });

  it('shows the name of the assigned group if the group exists', function (done) {
    emptyActivity.group = group;
    emptyActivity.participants = [];
    request(createApp('guest'))
      .get('/urlOfTheActivity')
      .expect(200)
      .expect(/Veranstaltet von der Gruppe&nbsp;<a href="\/groups\/groupname">Buxtehude<\/a>/, done);
  });

  it('shows all activities that take place at the day of the global code retreat', function (done) {
    emptyActivity.group = group;
    request(createApp())
      .get('/gdcr')
      .expect(200)
      .expect(/1 Coderetreats/, done);
  });

  describe('url check', function () {

    it('returns false for checkurl when the url already exists', function (done) {
      request(createApp())
        .get('/checkurl?url=urlOfTheActivity&previousUrl=x')
        .expect(200)
        .expect(/false/, done);
    });

    it('returns true for checkurl when the url does not exist', function (done) {
      request(createApp())
        .get('/checkurl?url=UnknownURL&previousUrl=x')
        .expect(200)
        .expect(/true/, done);
    });
  });

  describe('- when editors are being utilized -', function () {
    it('does not show the names of the editors for a guest visitor', function (done) {
      request(createApp())
        .get('/urlForEditors')
        .expect(200)
        .end(function (err, res) {
          expect(res.text).to.not.contain('Editoren:');
          expect(res.text).to.not.contain('participant1');
          expect(res.text).to.not.contain('participant3');
          done(err);
        });
    });

    it('shows the names of the editors for a registered member', function (done) {
      request(createApp({member: member1}))
        .get('/urlForEditors')
        .expect(200)
        .expect(/Editoren:&nbsp;<a href="\/members\/participant1">participant1<\/a>&nbsp;<a href="\/members\/participant3">participant3<\/a>\s*<\/p>/, done);
    });

    it('allows editing by the owner, displays the current editors and the possible editors (all participants but not the owner)', function (done) {
      sinon.stub(groupsService, 'getSubscribedGroupsForUser', function (user, callback) { callback(null, []); });

      request(createApp({member: member4}))
        .get('/edit/urlForEditors')
        .expect(200)
        .expect(/<option selected="selected">Firstname1 Lastname1 \(participant1\)/)
        .expect(/<option>Firstname2 Lastname2 \(participant2\)/)
        .expect(/<option selected="selected">Firstname3 Lastname3 \(participant3\)/)
        .end(done);
    });

    it('allows editing by an editor, displays the current editors and the possible editors (all participants but not the owner)', function (done) {
      sinon.stub(groupsService, 'getSubscribedGroupsForUser', function (user, callback) { callback(null, []); });

      request(createApp({member: member1}))
        .get('/edit/urlForEditors')
        .expect(200)
        .expect(/<option selected="selected">Firstname1 Lastname1 \(participant1\)/)
        .expect(/<option>Firstname2 Lastname2 \(participant2\)/)
        .expect(/<option selected="selected">Firstname3 Lastname3 \(participant3\)/)
        .end(done);
    });

  });
});
