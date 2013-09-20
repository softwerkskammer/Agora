"use strict";

var sinon = require('sinon');
var beans = require('../configureForTest').get('beans');

var expect = require('chai').expect;

var Member = beans.get('member');

var dummymember = new Member().initFromSessionUser({identifier: 'hada'});
var dummymember2 = new Member().initFromSessionUser({identifier: 'hada2'});

var Group = beans.get('group');

var GroupA = new Group({id: 'GroupA', longName: 'Gruppe A', description: 'Dies ist Gruppe A.', type: 'Themengruppe'});
var GroupB = new Group({id: 'GroupB', longName: 'Gruppe B', description: 'Dies ist Gruppe B.', type: 'Regionalgruppe'});

var membersAPI = beans.get('membersAPI');
var groupsAPI = beans.get('groupsAPI');

var systemUnderTest = beans.get('groupsAndMembersAPI');

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

describe('Groups and Members API (getGroupAndMembersForList)', function () {

  afterEach(function (done) {
    groupsAPI.getSympaUsersOfList.restore();
    groupsAPI.getGroup.restore();
    membersAPI.getMembersForEMails.restore();
    done();
  });

  it('returns null as group when there is no group and no sympa-list', function (done) {
    sinon.stub(membersAPI, 'getMembersForEMails', function (member, callback) { callback(); });
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function (err, callback) { callback(null, []); });
    sinon.stub(groupsAPI, 'getGroup', function (groupname, callback) { callback(null, null); });

    systemUnderTest.getGroupAndMembersForList('unbekannteListe', function (err, group) {
      expect(group).to.be.null;
      done(err);
    });
  });

  it('returns null as group when there is no group but a sympa-list', function (done) {
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function (err, callback) {
      callback(null, ['user1@mail1.com', 'user2@mail2.com']);
    });
    sinon.stub(membersAPI, 'getMembersForEMails', function (member, callback) {
      callback(null, [dummymember, dummymember2]);
    });
    sinon.stub(groupsAPI, 'getGroup', function (groupname, callback) { callback(null, null); });

    systemUnderTest.getGroupAndMembersForList('sympaListWithoutGroup', function (err, group) {
      expect(group).to.be.null;
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

    systemUnderTest.getGroupAndMembersForList('GroupA', function (err, group) {
      expect(group).to.equal(GroupA);
      expect(group.members).to.not.be.null;
      expect(group.members.length).to.equal(0);
      done(err);
    });
  });

  it('returns the group with the given name and a list of one subscribed user when there is one subscriber in sympa', function (done) {
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function (err, callback) { callback(null, ['user@email.com']); });
    sinon.stub(groupsAPI, 'getGroup', function (groupname, callback) {
      callback(null, GroupA);
    });
    sinon.stub(membersAPI, 'getMembersForEMails', function (member, callback) {
      callback(null, [dummymember]);
    });

    systemUnderTest.getGroupAndMembersForList('GroupA', function (err, group) {
      expect(group).to.equal(GroupA);
      expect(group.members).to.not.be.null;
      expect(group.members.length).to.equal(1);
      expect(group.members[0]).to.equal(dummymember);
      done(err);
    });
  });

});

describe('Groups and Members API (addMembersToGroup)', function () {

  afterEach(function (done) {
    groupsAPI.getSympaUsersOfList.restore();
    membersAPI.getMembersForEMails.restore();
    done();
  });

  it('returns null when the group is null', function (done) {
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function () {});
    sinon.stub(membersAPI, 'getMembersForEMails', function () {});

    systemUnderTest.addMembersToGroup(null, function (err, group) {
      expect(group).to.be.null;
      done(err);
    });
  });

  it('returns undefined when the group is undefined', function (done) {
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function () {});
    sinon.stub(membersAPI, 'getMembersForEMails', function () {});

    systemUnderTest.addMembersToGroup(undefined, function (err, group) {
      expect(group).to.be.undefined;
      done(err);
    });
  });

  it('returns the group with an empty list of subscribed users when there are no subscribers', function (done) {
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function (err, callback) { callback(null, []); });
    sinon.stub(membersAPI, 'getMembersForEMails', function (member, callback) {
      callback(null, []);
    });

    systemUnderTest.addMembersToGroup(GroupA, function (err, group) {
      expect(group).to.equal(GroupA);
      expect(group.members).to.not.be.null;
      expect(group.members.length).to.equal(0);
      delete group.members;
      done(err);
    });
  });

  it('returns the group with a list of one subscribed user when there is one subscriber in sympa', function (done) {
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function (err, callback) { callback(null, ['user@email.com']); });
    sinon.stub(membersAPI, 'getMembersForEMails', function (member, callback) {
      callback(null, [dummymember]);
    });

    systemUnderTest.addMembersToGroup(GroupA, function (err, group) {
      expect(group).to.equal(GroupA);
      expect(group.members).to.not.be.null;
      expect(group.members.length).to.equal(1);
      expect(group.members[0]).to.equal(dummymember);
      delete group.members;
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
