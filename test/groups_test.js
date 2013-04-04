/*global describe, it */
"use strict";
var request = require('supertest'),
  express = require('express'),
  proxyquire = require('proxyquire');

var Group = require('../lib/groups/group');
var Member = require('../lib/members/member');

var GroupA = new Group('GroupA', 'Gruppe A', 'Dies ist Gruppe A.', 'Themengruppe');
var MemberA = new Member('hada', 'hada', 'Hans', 'Dampf', 'hans.dampf@gmail.com', '@hada', 'Süden', 'Entwickler', 'ada', 'http://my.blog', 'beim Bier');

var groupsAPIStub = {
  getAllAvailableGroups: function () {},
  getGroup: function () {},
  groupFromObject: function () {},
  createOrSaveGroup: function (group, callback) { callback(); }
};

var groupsAndMembersAPIStub = {
  getGroupAndUsersOfList: function () {},
  userIsInMemberList: function () {}
};

var groupsApp = proxyquire('../lib/groups', {
  './groupsAPI'                          : function () {
    return groupsAPIStub;
  },
  '../groupsAndMembers/groupsAndMembersAPI': function () {
    return groupsAndMembersAPIStub;
  }
});

var app = groupsApp(express(), { get: function () {
  return null;
} });   // empty config


app.locals({
  baseUrl: 'groups'
});

describe('Groups application', function () {
  groupsAPIStub.getAllAvailableGroups = function (callback) { callback(null, [GroupA]); };

  it('shows all available lists', function (done) {
    request(app)
      .get('/')
      .expect(200)
      .expect('Content-Type', /text\/html/)
      .expect(/Alle Gruppen/)
      .expect(/Gruppe A/, done);
  });

  it('allows to create a new group', function (done) {

    request(app)
      .get('/new')
      .expect(200)
      .expect('Content-Type', /text\/html/)
      .expect(/<h1>Gruppe anlegen<\/h1>/)
      .expect(/<input type="submit" value="Anlegen">/, done);
  });

  it('allows to edit an existing group', function (done) {
    groupsAPIStub.getGroup = function (groupname, callback) {
      callback(null, GroupA);
    };

    request(app)
      .get('/edit/GroupA')
      .expect(200)
      .expect('Content-Type', /text\/html/)
      .expect(/<h1>Gruppe bearbeiten<\/h1>/)
      .expect(/<input type="submit" value="Speichern">/, done);
  });

  it('displays an existing group and its members', function (done) {
    groupsAndMembersAPIStub.getGroupAndUsersOfList = function (groupname, callback) {
      callback(null, GroupA, [MemberA]);
    };

    request(app)
      .get('/GroupA')
      .expect(200)
      .expect('Content-Type', /text\/html/)
      .expect(/<title>Gruppe A<\/title>/)
      .expect(/Dies ist Gruppe A./)
      .expect(/Themengruppe/)
      .expect(/Mitglieder der Gruppe:/)
      .expect(/<ul><li>Hans Dampf<\/li><\/ul>/)
      .end(done);
  });

  it('saves a newly created Group', function (done) {
    groupsAPIStub.groupFromObject = function () { return GroupA; };

    request(app)
      .post('/submit')
      .expect(302)
      .expect('Content-Type', /text\/plain/)
      .expect('Moved Temporarily. Redirecting to /null/groups/GroupA', done);
  });

  it('saves an already existing Group', function (done) {
    groupsAPIStub.groupFromObject = function () { return GroupA; };

    request(app)
      .post('/edit/submit')
      .expect(302)
      .expect('Content-Type', /text\/plain/)
      .expect('Moved Temporarily. Redirecting to /null/groups/GroupA', done);
  });


  it('redirects to the groups overview page if the group to save is not valid', function (done) {
    groupsAPIStub.groupFromObject = function () { return new Group(); };

    request(app)
      .post('/edit/submit')
      .expect(302)
      .expect('Content-Type', /text\/plain/)
      .expect('Moved Temporarily. Redirecting to /null/groups/', done);
  });

});