"use strict";

var sinon = require('sinon');
var conf = require('../configureForTest');

var expect = require('chai').expect;

var Member = conf.get('beans').get('member');

var dummymember = new Member().initFromSessionUser({identifier: 'hada'});
var dummymember2 = new Member().initFromSessionUser({identifier: 'hada2'});

var Group = conf.get('beans').get('group');

var GroupA = new Group({id: 'GroupA', longName: 'Gruppe A', description: 'Dies ist Gruppe A.', type: 'Themengruppe'});
var GroupB = new Group({id: 'GroupB', longName: 'Gruppe B', description: 'Dies ist Gruppe B.', type: 'Regionalgruppe'});

var membersAPI = conf.get('beans').get('membersAPI');
var groupsAPI = conf.get('beans').get('groupsAPI');

var systemUnderTest = conf.get('beans').get('groupsAndMembersAPI');

describe('Groups and Members API (getUserWithHisGroups)', function () {

  afterEach(function (done) {
    groupsAPI.getSubscribedGroupsForUser.restore();
    membersAPI.getMember.restore();
    done();
  });

  it('returns null as member and no groups when there is no member for the given nickname', function (done) {
    sinon.stub(membersAPI, 'getMember', function (nickname, callback) {
      callback(null, null);
    });
    sinon.stub(groupsAPI, 'getSubscribedGroupsForUser', function (userMail, globalCallback) {
      globalCallback(null, []);
    });

    systemUnderTest.getUserWithHisGroups('nickname', function (err, member, subscribedLists) {
      expect(member).to.be.null;
      expect(subscribedLists).to.not.be.null;
      expect(subscribedLists.length).to.equal(0);
      done();
    });
  });

  it('returns the member and his groups when there is a member for the given nickname', function (done) {
    sinon.stub(membersAPI, 'getMember', function (nickname, callback) {
      callback(null, dummymember);
    });
    sinon.stub(groupsAPI, 'getSubscribedGroupsForUser', function (userMail, globalCallback) {
      globalCallback(null, [GroupA, GroupB]);
    });

    systemUnderTest.getUserWithHisGroups('nickname', function (err, member, subscribedGroups) {
      expect(member).to.equal(dummymember);
      expect(subscribedGroups).to.not.be.null;
      expect(subscribedGroups.length).to.equal(2);
      expect(subscribedGroups[0]).to.equal(GroupA);
      expect(subscribedGroups[1]).to.equal(GroupB);
      done(err);
    });
  });
});

describe('Groups and Members API (getUserWithHisGroupsById)', function () {

  afterEach(function (done) {
    groupsAPI.getSubscribedGroupsForUser.restore();
    membersAPI.getMemberForId.restore();
    done();
  });
  it('returns the member (by id) and his groups when there is a member for the given nickname', function (done) {
    sinon.stub(membersAPI, 'getMemberForId', function (nickname, callback) {
      callback(null, dummymember);
    });
    sinon.stub(groupsAPI, 'getSubscribedGroupsForUser', function (userMail, globalCallback) {
      globalCallback(null, [GroupA, GroupB]);
    });

    systemUnderTest.getUserWithHisGroupsById('hada', function (err, member, subscribedGroups) {
      expect(member).to.equal(dummymember);
      expect(subscribedGroups).to.not.be.null;
      expect(subscribedGroups.length).to.equal(2);
      expect(subscribedGroups[0]).to.equal(GroupA);
      expect(subscribedGroups[1]).to.equal(GroupB);
      done(err);
    });
  });
});

describe('Groups and Members API (getGroupAndMembersForList)', function () {

  afterEach(function (done) {
    groupsAPI.getSympaUsersOfList.restore();
    groupsAPI.getGroup.restore();
    membersAPI.getMembersForEMails.restore();
    done();
  });

  it('returns null as group and an empty list of subscribed users when there is no group and no sympa-list', function (done) {
    sinon.stub(membersAPI, 'getMembersForEMails', function (member, callback) { callback(); });
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function (err, callback) { callback(null, []); });
    sinon.stub(groupsAPI, 'getGroup', function (groupname, callback) { callback(null, null); });

    systemUnderTest.getGroupAndMembersForList('unbekannteListe', function (err, group, users) {
      expect(group).to.be.null;
      expect(users).to.not.be.null;
      expect(users.length).to.equal(0);
      done(err);
    });
  });

  it('returns null as group and an empty list of subscribed users when there is no group but a sympa-list', function (done) {
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function (err, callback) {
      callback(null, ['user1@mail1.com', 'user2@mail2.com']);
    });
    sinon.stub(membersAPI, 'getMembersForEMails', function (member, callback) {
      callback(null, [dummymember, dummymember2]);
    });
    sinon.stub(groupsAPI, 'getGroup', function (groupname, callback) { callback(null, null); });

    systemUnderTest.getGroupAndMembersForList('sympaListWithoutGroup', function (err, group, users) {
      expect(group).to.be.null;
      expect(users).to.not.be.null;
      expect(users.length).to.equal(0);
      done(err);
    });
  });

  it('returns the group with the given name and an empty list of subscribed users when there is no sympa-list or when there are no subscribers', function (done) {
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function (err, callback) { callback(null, []); });
    sinon.stub(groupsAPI, 'getGroup', function (groupname, callback) {
      callback(null, GroupA);
    });
    sinon.stub(membersAPI, 'getMembersForEMails', function (member, callback) {
      callback(null, []);
    });

    systemUnderTest.getGroupAndMembersForList('GroupA', function (err, group, users) {
      expect(group).to.equal(GroupA);
      expect(users).to.not.be.null;
      expect(users.length).to.equal(0);
      done(err);
    });
  });
});

describe('Groups and Members API (userIsInMemberList)', function () {

  it('returns false if the user id is undefined', function (done) {
    var result = systemUnderTest.userIsInMemberList(undefined, [dummymember, dummymember2]);

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
    var result = systemUnderTest.userIsInMemberList('hada', [dummymember, dummymember2]);

    expect(result).to.be.true;
    done();
  });
});
