'use strict';

const request = require('supertest');
const sinon = require('sinon').sandbox.create();

const beans = require('../../testutil/configureForTest').get('beans');
const groupsPersistence = beans.get('groupsPersistence');
const membersPersistence = beans.get('membersPersistence');
const membersService = beans.get('membersService');
const activitystore = beans.get('activitystore');
const Group = beans.get('group');
const Activity = beans.get('activity');
const fakeListAdapter = beans.get('fakeListAdapter');
const fieldHelpers = beans.get('fieldHelpers');
const wikiObjects = beans.get('wikiObjects');
const wikiService = beans.get('wikiService');

const createApp = require('../../testutil/testHelper')('groupsApp').createApp;

const GroupA = new Group({
  id: 'GroupA',
  longName: 'Gruppe A',
  description: 'Dies ist Gruppe A.',
  type: 'Themengruppe',
  emailPrefix: 'Group-A',
  organizers: ['organizer']
});

describe('Groups application', () => {

  before(() => {
    sinon.stub(fakeListAdapter, 'getAllAvailableLists').callsFake(callback => callback(null, ['GroupA']));

    sinon.stub(fakeListAdapter, 'getUsersOfList').callsFake((groupname, callback) => {
      if (groupname === 'groupa') {
        return callback(null, ['peter@google.de', 'hans@aol.com']);
      }
      callback(null, []);
    });

    sinon.stub(membersPersistence, 'list').callsFake((sortorder, callback) => {
      callback(null, [
        {nickname: 'hada', firstname: 'Hans', lastname: 'Dampf', email: 'hans@aol.com'},
        {nickname: 'pepe', firstname: 'Peter', lastname: 'Meyer', email: 'peter@google.de'}
      ]);
    });

    sinon.stub(membersPersistence, 'listByField').callsFake((email, sortOrder, callback) => {
      callback(null, [
        {nickname: 'hada', firstname: 'Hans', lastname: 'Dampf', email: 'hans@aol.com'},
        {nickname: 'pepe', firstname: 'Peter', lastname: 'Meyer', email: 'peter@google.de'}
      ]);
    });

    sinon.stub(membersService, 'putAvatarIntoMemberAndSave').callsFake((member, callback) => {
      callback();
    });

    sinon.stub(groupsPersistence, 'listByIds').callsFake((list, sortOrder, callback) => {
      if (list[0] === 'GroupA') { return callback(null, [GroupA]); }
      return callback(null, []);
    });

    sinon.stub(groupsPersistence, 'getById').callsFake((list, callback) => {
      if (list.test('GroupA')) { return callback(null, GroupA); }
      return callback(null, null);
    });

    sinon.stub(groupsPersistence, 'getByField').callsFake((list, callback) => {
      if (list.emailPrefix.test('Group-A')) { return callback(null, GroupA); }
      return callback(null, null);
    });
  });

  after(() => {
    sinon.restore();
  });

  describe('index page', () => {
    it('shows all available groups', done => {
      request(createApp())
        .get('/')
        .expect(200)
        .expect('Content-Type', /text\/html/)
        .expect(/Gruppen/)
        .expect(/Gruppe A/, done);
    });
  });

  describe('groupname check', () => {

    it('returns false for checkgroupname when the group name already exists', done => {
      request(createApp())
        .get('/checkgroupname?id=GroupA')
        .expect(200)
        .expect(/false/, done);
    });

    it('returns true for checkgroupname when the group name does not exist', done => {
      request(createApp())
        .get('/checkgroupname?id=UnknownGroup')
        .expect(200)
        .expect(/true/, done);
    });

    it('allows dashes and underscores in the groupname', done => {
      request(createApp())
        .get('/checkgroupname?id=Un_known-Group')
        .expect(200)
        .expect(/true/, done);
    });

    it('allows an empty groupname', done => {
      request(createApp())
        .get('/checkgroupname?id=')
        .expect(200)
        .expect(/true/, done);
    });
  });

  describe('eMail-Prefix check', () => {

    it('returns false for checkemailprefix when the prefix already exists', done => {
      request(createApp())
        .get('/checkemailprefix?emailPrefix=Group-A')
        .expect(200)
        .expect(/false/, done);
    });

    it('returns true for checkemailprefix when the prefix does not exist', done => {
      request(createApp())
        .get('/checkemailprefix?emailPrefix=UnknownPrefix')
        .expect(200)
        .expect(/true/, done);
    });

    it('allows dashes and underscores in the prefix', done => {
      request(createApp())
        .get('/checkemailprefix?emailPrefix=Un_known-Prefix')
        .expect(200)
        .expect(/true/, done);
    });

    it('allows an empty prefix', done => {
      request(createApp())
        .get('/checkemailprefix?emailPrefix=')
        .expect(200)
        .expect(/true/, done);
    });
  });

  describe('group page', () => {

    it('displays an existing group and membercount if nobody is logged in', done => {
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

    it('displays an existing group and its members if somebody is logged in', done => {
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

    it('displays the group\'s upcoming activities', done => {
      const date1 = fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013');
      const date2 = fieldHelpers.parseToUnixUsingDefaultTimezone('01.05.2013');

      sinon.stub(activitystore, 'upcomingActivitiesForGroupIds').callsFake((list, callback) => callback(null, [new Activity({
        title: 'Erste Aktivität',
        startUnix: date1
      }), new Activity({
        title: 'Zweite Aktivität',
        startUnix: date2
      })]));

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

  describe('group feed', () => {
    it('renders blog posts as XML', done => {
      sinon.stub(wikiService, 'getBlogpostsForGroup').callsFake((groupid, callback) => {
        callback(null, [
          new wikiObjects.Blogpost('blog_2018-01-02_foo', '#Foo\n\nTeaser 1'),
          new wikiObjects.Blogpost('blog_2018-02-03_bar', '#Bar\n\nTeaser 2')
        ]);
      });
      request(createApp())
        .get('/GroupA/feed')
        .expect('Content-Type', /xml/)
        .expect(200)
        .expect(/Foo/).expect(/Teaser 1/).expect(/blog_2018-01-02_foo/)
        .expect(/Bar/).expect(/Teaser 2/).expect(/blog_2018-02-03_bar/)
        .expect(/<\/feed>\s*$/, done);
    });
  });

  describe('group creation', () => {
    it('opens the group creation page', done => {
      request(createApp({id: 'someMember'}))
        .get('/new')
        .expect(200)
        .expect('Content-Type', /text\/html/)
        .expect(/Gruppe anlegen/, done);
    });

    it('lists the group creator as contact', done => {
      request(createApp({id: 'theMemberThatCreatesTheGroup'}))
        .get('/new')
        .expect(200)
        .expect(/Ansprechpartner/)
        .expect(/theMemberThatCreatesTheGroup/, done);
    });
  });

  describe('group editing', () => {
    it('opens the group editing page', done => {
      request(createApp({id: 'organizer'}))
        .get('/edit/GroupA')
        .expect(200)
        .expect('Content-Type', /text\/html/)
        .expect(/Gruppe &quot;groupa&quot; bearbeiten/, done);
    });

    it('lists all group members as possible contacts', done => {
      request(createApp({id: 'organizer'}))
        .get('/edit/GroupA')
        .expect(200)
        .expect(/Ansprechpartner/)
        .expect(/pepe/)
        .expect(/hada/, done);
    });

    it('disallows editing an existing group for non contact persons', done => {
      request(createApp({id: 'someMember'}))
        .get('/edit/GroupA')
        .expect(302)
        .expect('location', /\/groups\/GroupA/, done);
    });
  });

});
