"use strict";

var request = require('supertest');
var sinon = require('sinon').sandbox.create();

var beans = require('../configureForTest').get('beans');
var groupsPersistence = beans.get('groupsPersistence');
var membersPersistence = beans.get('membersPersistence');
var Group = beans.get('group');
var sympa = beans.get('sympaStub');

var createApp = require('../testHelper')('groupsApp').createApp;

var GroupA = new Group({id: 'GroupA', longName: 'Gruppe A', description: 'Dies ist Gruppe A.', type: 'Themengruppe', emailPrefix: 'Group-A', organizers: ['organizer']});

describe('Groups application', function () {

  before(function () {
    sinon.stub(sympa, 'getAllAvailableLists', function (callback) {
      return callback(null, ['GroupA']);
    });

    sinon.stub(sympa, 'getUsersOfList', function (groupname, callback) {
      if (groupname === 'groupa') {
        return callback(null, ['peter@google.de', 'hans@aol.com']);
      }
      callback(null, []);
    });

    sinon.stub(membersPersistence, 'list', function (sortorder, callback) {
      callback(null, null);
    });

    sinon.stub(membersPersistence, 'listByField', function (email, sortOrder, callback) {
      callback(null, [
        { nickname: 'hada', firstname: 'Hans', lastname: 'Dampf', email: 'hans@aol.com' },
        { nickname: 'pepe', firstname: 'Peter', lastname: 'Meyer', email: 'peter@google.de' }
      ]);
    });

    sinon.stub(groupsPersistence, 'listByIds', function (list, sortOrder, callback) {
      if (list[0] === 'GroupA') { return callback(null, [GroupA]); }
      return callback(null, []);
    });

    sinon.stub(groupsPersistence, 'getById', function (list, callback) {
      if (list.test('GroupA')) { return callback(null, GroupA); }
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
  });

  describe('group page', function () {

    it('displays an existing group and membercount if nobody is logged in', function (done) {
      request(createApp())
        .get('/GroupA')
        .expect(200)
        .expect('Content-Type', /text\/html/)
        .expect(/<title>Gruppe A/)
        .expect(/Dies ist Gruppe A./)
        .expect(/Themengruppe/)
        .expect(/Mitglieder:/)
        .expect(/Diese Gruppe hat&nbsp;2 Mitglieder./, done);
    });

    it('displays an existing group and its members if somebody is logged in', function (done) {
      request(createApp('someMember'))
        .get('/GroupA')
        .expect(200)
        .expect('Content-Type', /text\/html/)
        .expect(/<title>Gruppe A/)
        .expect(/Dies ist Gruppe A./)
        .expect(/Themengruppe/)
        .expect(/Mitglieder:/)
        .expect(/Diese Gruppe hat&nbsp;2 Mitglieder./)
        .expect(/Peter Meyer/)
        .expect(/Hans Dampf/, done);
    });

  });

  describe('group creation', function () {
    it('opens the group creation page', function (done) {
      request(createApp('someMember'))
        .get('/new')
        .expect(200)
        .expect('Content-Type', /text\/html/)
        .expect(/Gruppe anlegen/, done);
    });

    it('lists the group creator as contact', function (done) {
      request(createApp('theMemberThatCreatesTheGroup'))
        .get('/new')
        .expect(200)
        .expect(/Ansprechpartner/)
        .expect(/theMemberThatCreatesTheGroup/, done);
    });
  });

  describe('group editing', function () {
    it('opens the group editing page', function (done) {
      request(createApp('organizer'))
        .get('/edit/GroupA')
        .expect(200)
        .expect('Content-Type', /text\/html/)
        .expect(/Gruppe &quot;groupa&quot; bearbeiten/, done);
    });

    it('lists all group members as possible contacts', function (done) {
      request(createApp('organizer'))
        .get('/edit/GroupA')
        .expect(200)
        .expect(/Ansprechpartner/)
        .expect(/pepe/)
        .expect(/hada/, done);
    });

    it('disallows editing an existing group for non contact persons', function (done) {
      request(createApp('someMember'))
        .get('/edit/GroupA')
        .expect(302)
        .expect('location', /\/groups\/GroupA/, done);
    });
  });

});
