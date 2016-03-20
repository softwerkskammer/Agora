'use strict';

var request = require('supertest');
var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTest').get('beans');
var groupsPersistence = beans.get('groupsPersistence');
var membersPersistence = beans.get('membersPersistence');
var membersService = beans.get('membersService');
var activitystore = beans.get('activitystore');
var Group = beans.get('group');
var Activity = beans.get('activity');
var fakeListAdapter = beans.get('fakeListAdapter');
var fieldHelpers = beans.get('fieldHelpers');

var createApp = require('../../testutil/testHelper')('groupsApp').createApp;

var GroupA = new Group({
  id: 'GroupA',
  longName: 'Gruppe A',
  description: 'Dies ist Gruppe A.',
  type: 'Themengruppe',
  emailPrefix: 'Group-A',
  organizers: ['organizer']
});

describe('Groups application', function () {

  before(function () {
    sinon.stub(fakeListAdapter, 'getAllAvailableLists', function (callback) {
      return callback(null, ['GroupA']);
    });

    sinon.stub(fakeListAdapter, 'getUsersOfList', function (groupname, callback) {
      if (groupname === 'groupa') {
        return callback(null, ['peter@google.de', 'hans@aol.com']);
      }
      callback(null, []);
    });

    sinon.stub(membersPersistence, 'list', function (sortorder, callback) {
      callback(null, [
        {nickname: 'hada', firstname: 'Hans', lastname: 'Dampf', email: 'hans@aol.com'},
        {nickname: 'pepe', firstname: 'Peter', lastname: 'Meyer', email: 'peter@google.de'}
      ]);
    });

    sinon.stub(membersPersistence, 'listByField', function (email, sortOrder, callback) {
      callback(null, [
        {nickname: 'hada', firstname: 'Hans', lastname: 'Dampf', email: 'hans@aol.com'},
        {nickname: 'pepe', firstname: 'Peter', lastname: 'Meyer', email: 'peter@google.de'}
      ]);
    });

    sinon.stub(membersService, 'putAvatarIntoMemberAndSave', function (member, callback) {
      callback();
    });

    sinon.stub(groupsPersistence, 'listByIds', function (list, sortOrder, callback) {
      if (list[0] === 'GroupA') { return callback(null, [GroupA]); }
      return callback(null, []);
    });

    sinon.stub(groupsPersistence, 'getById', function (list, callback) {
      if (list.test('GroupA')) { return callback(null, GroupA); }
      return callback(null, null);
    });

    sinon.stub(groupsPersistence, 'getByField', function (list, callback) {
      if (list.emailPrefix.test('Group-A')) { return callback(null, GroupA); }
      return callback(null, null);
    });
  });

  after(function () {
    sinon.restore();
  });

  describe('index page', function () {
    it('shows all available groups', function (done) {
      request(createApp())
        .get('/')
        .expect(200)
        .expect('Content-Type', /text\/html/)
        .expect(/Gruppen/)
        .expect(/Gruppe A/, done);
    });
  });

  describe('groupname check', function () {

    it('returns false for checkgroupname when the group name already exists', function (done) {
      request(createApp())
        .get('/checkgroupname?id=GroupA')
        .expect(200)
        .expect(/false/, done);
    });

    it('returns true for checkgroupname when the group name does not exist', function (done) {
      request(createApp())
        .get('/checkgroupname?id=UnknownGroup')
        .expect(200)
        .expect(/true/, done);
    });

    it('allows dashes and underscores in the groupname', function (done) {
      request(createApp())
        .get('/checkgroupname?id=Un_known-Group')
        .expect(200)
        .expect(/true/, done);
    });

    it('allows an empty groupname', function (done) {
      request(createApp())
        .get('/checkgroupname?id=')
        .expect(200)
        .expect(/true/, done);
    });
  });

  describe('eMail-Prefix check', function () {

    it('returns false for checkemailprefix when the prefix already exists', function (done) {
      request(createApp())
        .get('/checkemailprefix?emailPrefix=Group-A')
        .expect(200)
        .expect(/false/, done);
    });

    it('returns true for checkemailprefix when the prefix does not exist', function (done) {
      request(createApp())
        .get('/checkemailprefix?emailPrefix=UnknownPrefix')
        .expect(200)
        .expect(/true/, done);
    });

    it('allows dashes and underscores in the prefix', function (done) {
      request(createApp())
        .get('/checkemailprefix?emailPrefix=Un_known-Prefix')
        .expect(200)
        .expect(/true/, done);
    });

    it('allows an empty prefix', function (done) {
      request(createApp())
        .get('/checkemailprefix?emailPrefix=')
        .expect(200)
        .expect(/true/, done);
    });
  });

  describe('group page', function () {

    it('displays an existing group and membercount if nobody is logged in', function (done) {
      request(createApp())
        .get('/GroupA')
        .expect(200)
        .expect('Content-Type', /text\/html/)
        .expect(/<title>Gruppe A/)
        .expect(/Dies ist Gruppe A\./)
        .expect(/Themengruppe/)
        .expect(/Mitglieder:/)
        .expect(/Diese Gruppe hat 2 Mitglieder\./, done);
    });

    it('displays an existing group and its members if somebody is logged in', function (done) {
      request(createApp({id: 'someMember'}))
        .get('/GroupA')
        .expect(200)
        .expect('Content-Type', /text\/html/)
        .expect(/<title>Gruppe A/)
        .expect(/Dies ist Gruppe A\./)
        .expect(/Themengruppe/)
        .expect(/Mitglieder:/)
        .expect(/Diese Gruppe hat 2 Mitglieder\./)
        .expect(/Peter Meyer/)
        .expect(/Hans Dampf/, done);
    });

    it('displays the group\'s upcoming activities', function (done) {
      var date1 = fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013');
      var date2 = fieldHelpers.parseToUnixUsingDefaultTimezone('01.05.2013');

      sinon.stub(activitystore, 'upcomingActivitiesForGroupIds', function (list, callback) {
        return callback(null, [new Activity({
          title: 'Erste Aktivität',
          startUnix: date1
        }), new Activity({
          title: 'Zweite Aktivität',
          startUnix: date2
        })]);
      });

      request(createApp())
        .get('/GroupA')
        .expect(200)
        .expect('Content-Type', /text\/html/)
        .expect(/Kommende Aktivitäten:/)
        .expect(/1\. Januar 2013/)
        .expect(/Erste Aktivität/)
        .expect(/1\. Mai 2013/)
        .expect(/Zweite Aktivität/, done);
    });

  });

  describe('group creation', function () {
    it('opens the group creation page', function (done) {
      request(createApp({id: 'someMember'}))
        .get('/new')
        .expect(200)
        .expect('Content-Type', /text\/html/)
        .expect(/Gruppe anlegen/, done);
    });

    it('lists the group creator as contact', function (done) {
      request(createApp({id: 'theMemberThatCreatesTheGroup'}))
        .get('/new')
        .expect(200)
        .expect(/Ansprechpartner/)
        .expect(/theMemberThatCreatesTheGroup/, done);
    });
  });

  describe('group editing', function () {
    it('opens the group editing page', function (done) {
      request(createApp({id: 'organizer'}))
        .get('/edit/GroupA')
        .expect(200)
        .expect('Content-Type', /text\/html/)
        .expect(/Gruppe &quot;groupa&quot; bearbeiten/, done);
    });

    it('lists all group members as possible contacts', function (done) {
      request(createApp({id: 'organizer'}))
        .get('/edit/GroupA')
        .expect(200)
        .expect(/Ansprechpartner/)
        .expect(/pepe/)
        .expect(/hada/, done);
    });

    it('disallows editing an existing group for non contact persons', function (done) {
      request(createApp({id: 'someMember'}))
        .get('/edit/GroupA')
        .expect(302)
        .expect('location', /\/groups\/GroupA/, done);
    });
  });

});
