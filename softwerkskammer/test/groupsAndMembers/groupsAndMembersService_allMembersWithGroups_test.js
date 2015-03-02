'use strict';

var sinon = require('sinon').sandbox.create();
var beans = require('../../testutil/configureForTest').get('beans');

var expect = require('must');

var Member = beans.get('member');

var dummymember = new Member().initFromSessionUser({authenticationId: 'hada', profile: {emails: [{value: 'email'}]}});
var dummymember2 = new Member().initFromSessionUser({authenticationId: 'hada2', profile: {emails: [{value: 'email'}]}});

var Group = beans.get('group');

var GroupA = new Group({id: 'GroupA', longName: 'Gruppe A', description: 'Dies ist Gruppe A.', type: 'Themengruppe'});
var GroupB = new Group({id: 'GroupB', longName: 'Gruppe B', description: 'Dies ist Gruppe B.', type: 'Regionalgruppe'});

var memberstore = beans.get('memberstore');
var groupsService = beans.get('groupsService');
var groupstore = beans.get('groupstore');

var groupsAndMembersService = beans.get('groupsAndMembersService');

describe('Groups and Members Service (getAllMembersWithTheirGroups)', function () {

  afterEach(function () {
    sinon.restore();
  });

  it('returns no members when there are no members', function (done) {
    sinon.stub(memberstore, 'allMembers', function (callback) {
      callback(null, []);
    });

    groupsAndMembersService.getAllMembersWithTheirGroups(function (err, members) {
      expect(members).to.be.empty();
      done(err);
    });
  });

  it('returns a member and his groups when there is a member who has groups', function (done) {
    sinon.stub(memberstore, 'allMembers', function (callback) {
      callback(null, [dummymember]);
    });
    sinon.stub(groupsService, 'getSubscribedGroupsForUser', function (userMail, globalCallback) {
      globalCallback(null, [GroupA, GroupB]);
    });

    groupsAndMembersService.getAllMembersWithTheirGroups(function (err, members) {
      expect(members.length).to.equal(1);
      expect(members[0]).to.equal(dummymember);
      expect(members[0].subscribedGroups).to.not.be(null);
      expect(members[0].subscribedGroups.length).to.equal(2);
      expect(members[0].subscribedGroups[0]).to.equal(GroupA);
      expect(members[0].subscribedGroups[1]).to.equal(GroupB);
      done(err);
    });
  });

  it('returns a member without groups when there is a member who has no groups', function (done) {
    sinon.stub(memberstore, 'allMembers', function (callback) {
      callback(null, [dummymember]);
    });
    sinon.stub(groupsService, 'getSubscribedGroupsForUser', function (userMail, globalCallback) {
      globalCallback(null, []);
    });

    groupsAndMembersService.getAllMembersWithTheirGroups(function (err, members) {
      expect(members.length).to.equal(1);
      expect(members[0]).to.equal(dummymember);
      expect(members[0].subscribedGroups).to.not.be(null);
      expect(members[0].subscribedGroups.length).to.equal(0);
      done(err);
    });
  });

  it('returns a member with and one without groups', function (done) {
    sinon.stub(memberstore, 'allMembers', function (callback) {
      callback(null, [dummymember, dummymember2]);
    });

    var memberCount = 1;
    sinon.stub(groupsService, 'getSubscribedGroupsForUser', function (userMail, globalCallback) {
      if (memberCount === 1) {
        memberCount = memberCount + 1;
        return globalCallback(null, []);
      }
      return globalCallback(null, [GroupA, GroupB]);
    });

    groupsAndMembersService.getAllMembersWithTheirGroups(function (err, members) {
      expect(members.length).to.equal(2);
      expect(members[0]).to.equal(dummymember);
      expect(members[0].subscribedGroups).to.not.be(null);
      expect(members[0].subscribedGroups.length).to.equal(0);
      expect(members[1]).to.equal(dummymember2);
      expect(members[1].subscribedGroups).to.not.be(null);
      expect(members[1].subscribedGroups.length).to.equal(2);
      expect(members[1].subscribedGroups[0]).to.equal(GroupA);
      expect(members[1].subscribedGroups[1]).to.equal(GroupB);
      done(err);
    });
  });
});
