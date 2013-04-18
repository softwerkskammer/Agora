/*global describe, it */
"use strict";
var proxyquire = require('proxyquire');

var expect = require('chai').expect;

var Member = require('../../lib/members/member');

var dummymember = new Member();
dummymember.id = 'hada';
var dummymember2 = new Member();
dummymember2.id = 'hada2';

var Group = require('../../lib/groups/group');

var GroupA = new Group('GroupA', 'Gruppe A', 'Dies ist Gruppe A.', 'Themengruppe');
var GroupB = new Group('GroupB', 'Gruppe B', 'Dies ist Gruppe B.', 'Regionalgruppe');

var groupsAPIStub = {
  getSubscribedGroupsForUser: function () {},
  getSympaUsersOfList: function (err, callback) { callback(null, []); },
  getGroup: function (groupname, callback) { callback(null, null); },
  filterValidElements: function (elems) { return elems; }
};

var membersAPIStub = {
  getMember: function () {},
  getMemberForId: function () {},
  getMembersForEMails: function () {}
};

var groupsAndMembersAPI = proxyquire('../../lib/groupsAndMembers/groupsAndMembersAPI', {
  '../groups/groupsAPI': function () { return groupsAPIStub; },
  '../members/membersAPI': function () { return membersAPIStub; }
});

var systemUnderTest = groupsAndMembersAPI({ get: function () { return null; } });   // empty config -> sympaStub is required

describe('Groups and Members API', function () {

  it('returns null as member and no groups when there is no member for the given nickname', function (done) {
    membersAPIStub.getMember = function (nickname, callback) {
      callback(null, null);
    };
    groupsAPIStub.getSubscribedGroupsForUser = function (userMail, globalCallback) {
      globalCallback(null, []);
    };

    systemUnderTest.getUserWithHisGroups('nickname', function (err, member, subscribedLists) {
      expect(member).to.be.null;
      expect(subscribedLists).to.not.be.null;
      expect(subscribedLists.length).to.equal(0);
      done();
    });
  });

  it('returns the member and his groups when there is a member for the given nickname', function (done) {
    membersAPIStub.getMember = function (nickname, callback) {
      callback(null, dummymember);
    };
    groupsAPIStub.getSubscribedGroupsForUser = function (userMail, globalCallback) {
      globalCallback(null, [GroupA, GroupB]);
    };

    systemUnderTest.getUserWithHisGroups('nickname', function (err, member, subscribedGroups) {
      expect(member).to.equal(dummymember);
      expect(subscribedGroups).to.not.be.null;
      expect(subscribedGroups.length).to.equal(2);
      expect(subscribedGroups[0]).to.equal(GroupA);
      expect(subscribedGroups[1]).to.equal(GroupB);
      done(err);
    });
  });

  it('returns the member (by id) and his groups when there is a member for the given nickname', function (done) {
    membersAPIStub.getMemberForId = function (nickname, callback) {
      callback(null, dummymember);
    };
    groupsAPIStub.getSubscribedGroupsForUser = function (userMail, globalCallback) {
      globalCallback(null, [GroupA, GroupB]);
    };

    systemUnderTest.getUserWithHisGroupsById('hada', function (err, member, subscribedGroups) {
      expect(member).to.equal(dummymember);
      expect(subscribedGroups).to.not.be.null;
      expect(subscribedGroups.length).to.equal(2);
      expect(subscribedGroups[0]).to.equal(GroupA);
      expect(subscribedGroups[1]).to.equal(GroupB);
      done(err);
    });
  });

  it('returns null as group and an empty list of subscribed users when there is no group and no sympa-list', function (done) {
    membersAPIStub.getMembersForEMails = function (member, callback) { callback(); };

    systemUnderTest.getGroupAndUsersOfList('unbekannteListe', function (err, group, users) {
      expect(group).to.be.null;
      expect(users).to.not.be.null;
      expect(users.length).to.equal(0);
      done(err);
    });
  });

  it('returns null as group and an empty list of subscribed users when there is no group but a sympa-list', function (done) {
    groupsAPIStub.getSympaUsersOfList = function (err, callback) {
      callback(null, ['user1@mail1.com', 'user2@mail2.com']);
    };
    membersAPIStub.getMembersForEMails = function (member, callback) {
      callback(null, [dummymember, dummymember2]);
    };

    systemUnderTest.getGroupAndUsersOfList('sympaListWithoutGroup', function (err, group, users) {
      expect(group).to.be.null;
      expect(users).to.not.be.null;
      expect(users.length).to.equal(0);
      done(err);
    });
  });

  it('returns the group with the given name and an empty list of subscribed users when there is no sympa-list or when there are no subscribers', function (done) {
    groupsAPIStub.getGroup = function (groupname, callback) {
      callback(null, GroupA);
    };
    membersAPIStub.getMembersForEMails = function (member, callback) {
      callback(null, []);
    };

    systemUnderTest.getGroupAndUsersOfList('GroupA', function (err, group, users) {
      expect(group).to.equal(GroupA);
      expect(users).to.not.be.null;
      expect(users.length).to.equal(0);
      done(err);
    });
  });

  it('returns false if the user id is undefined', function (done) {
    var result = systemUnderTest.userIsInMemberList(undefined, [dummymember]);

    expect(result).to.be.false;
    done();
  });

  it('returns false if the member list is empty', function (done) {
    var result = systemUnderTest.userIsInMemberList('hada', []);

    expect(result).to.be.false;
    done();
  });

  it('returns false if the user is not in the member list', function (done) {
    var result = systemUnderTest.userIsInMemberList('trallala', [dummymember]);

    expect(result).to.be.false;
    done();
  });

  it('returns true if the user is in the member list', function (done) {
    var result = systemUnderTest.userIsInMemberList('hada', [dummymember]);

    expect(result).to.be.true;
    done();
  });


});
