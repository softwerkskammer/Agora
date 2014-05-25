"use strict";

var sinon = require('sinon').sandbox.create();
var beans = require('../../testutil/configureForTest').get('beans');

var expect = require('must');

var Member = beans.get('member');

var dummymember = new Member().initFromSessionUser({authenticationId: 'hada'});
var dummymember2 = new Member().initFromSessionUser({authenticationId: 'hada2'});

var Group = beans.get('group');

var GroupA = new Group({id: 'GroupA', longName: 'Gruppe A', description: 'Dies ist Gruppe A.', type: 'Themengruppe'});
var GroupB = new Group({id: 'GroupB', longName: 'Gruppe B', description: 'Dies ist Gruppe B.', type: 'Regionalgruppe'});

var membersAPI = beans.get('membersAPI');
var memberstore = beans.get('memberstore');
var groupsAPI = beans.get('groupsAPI');

var groupsAndMembersAPI = beans.get('groupsAndMembersAPI');

describe('Groups and Members API (getUserWithHisGroups or getMemberWithHisGroupsByMemberId)', function () {

  afterEach(function () {
    sinon.restore();
  });

  describe('- getUserWithHisGroups -', function () {
    it('returns no member when there is no member for the given nickname', function (done) {
      sinon.stub(memberstore, 'getMember', function (nickname, callback) {
        callback(null, null);
      });

      groupsAndMembersAPI.getUserWithHisGroups('nickname', function (err, member) {
        expect(member).to.not.exist();
        done(err);
      });
    });

    it('returns the member and his groups when there is a member for the given nickname', function (done) {
      sinon.stub(memberstore, 'getMember', function (nickname, callback) {
        callback(null, dummymember);
      });
      sinon.stub(groupsAPI, 'getSubscribedGroupsForUser', function (userMail, globalCallback) {
        globalCallback(null, [GroupA, GroupB]);
      });

      groupsAndMembersAPI.getUserWithHisGroups('nickname', function (err, member) {
        expect(member).to.equal(dummymember);
        expect(member.subscribedGroups).to.not.be(null);
        expect(member.subscribedGroups.length).to.equal(2);
        expect(member.subscribedGroups[0]).to.equal(GroupA);
        expect(member.subscribedGroups[1]).to.equal(GroupB);
        done(err);
      });
    });
  });

  describe('- getAllUsersWithTheirGroups -', function () {
    it('returns no members when there are no members', function (done) {
      sinon.stub(memberstore, 'allMembers', function (callback) {
        callback(null, []);
      });

      groupsAndMembersAPI.getAllUsersWithTheirGroups(function (err, members) {
        expect(members).to.be.empty();
        done(err);
      });
    });

    it('returns a member and his groups when there is a member who has groups', function (done) {
      sinon.stub(memberstore, 'allMembers', function (callback) {
        callback(null, [dummymember]);
      });
      sinon.stub(groupsAPI, 'getSubscribedGroupsForUser', function (userMail, globalCallback) {
        globalCallback(null, [GroupA, GroupB]);
      });

      groupsAndMembersAPI.getAllUsersWithTheirGroups(function (err, members) {
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
      sinon.stub(groupsAPI, 'getSubscribedGroupsForUser', function (userMail, globalCallback) {
        globalCallback(null, []);
      });

      groupsAndMembersAPI.getAllUsersWithTheirGroups(function (err, members) {
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
      sinon.stub(groupsAPI, 'getSubscribedGroupsForUser', function (userMail, globalCallback) {
        if (memberCount === 1) {
          memberCount = memberCount + 1;
          return globalCallback(null, []);
        }
        return globalCallback(null, [GroupA, GroupB]);
      });

      groupsAndMembersAPI.getAllUsersWithTheirGroups(function (err, members) {
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

  describe('- getMemberWithHisGroupsByMemberId -', function () {
    it('returns no member when there is no member for the given memberID', function (done) {
      sinon.stub(memberstore, 'getMemberForId', function (memberID, callback) {
        callback(null, null);
      });

      groupsAndMembersAPI.getMemberWithHisGroupsByMemberId('id', function (err, member) {
        expect(member).to.not.exist();
        done(err);
      });
    });

    it('returns the member and his groups when there is a member for the given memberID', function (done) {
      sinon.stub(memberstore, 'getMemberForId', function (memberID, callback) {
        callback(null, dummymember);
      });
      sinon.stub(groupsAPI, 'getSubscribedGroupsForUser', function (userMail, globalCallback) {
        globalCallback(null, [GroupA, GroupB]);
      });

      groupsAndMembersAPI.getMemberWithHisGroupsByMemberId('id', function (err, member) {
        expect(member).to.equal(dummymember);
        expect(member.subscribedGroups).to.not.be(null);
        expect(member.subscribedGroups.length).to.equal(2);
        expect(member.subscribedGroups[0]).to.equal(GroupA);
        expect(member.subscribedGroups[1]).to.equal(GroupB);
        done(err);
      });
    });
  });
});

describe('Groups and Members API (getGroupAndMembersForList)', function () {

  beforeEach(function () {
    sinon.stub(memberstore, 'allMembers', function (callback) { callback(null, null); });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('returns no group when there is no group and no sympa-list', function (done) {
    sinon.stub(membersAPI, 'getMembersForEMails', function (member, callback) { callback(); });
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function (err, callback) { callback(null, []); });
    sinon.stub(groupsAPI, 'getGroup', function (groupname, callback) { callback(null, null); });

    groupsAndMembersAPI.getGroupAndMembersForList('unbekannteListe', function (err, group) {
      expect(group).to.not.exist();
      done(err);
    });
  });

  it('returns no group when there is no group but a sympa-list', function (done) {
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function (err, callback) {
      callback(null, ['user1@mail1.com', 'user2@mail2.com']);
    });
    sinon.stub(membersAPI, 'getMembersForEMails', function (member, callback) {
      callback(null, [dummymember, dummymember2]);
    });
    sinon.stub(groupsAPI, 'getGroup', function (groupname, callback) { callback(null, null); });

    groupsAndMembersAPI.getGroupAndMembersForList('sympaListWithoutGroup', function (err, group) {
      expect(group).to.not.exist();
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

    groupsAndMembersAPI.getGroupAndMembersForList('GroupA', function (err, group) {
      expect(group).to.equal(GroupA);
      expect(group.members).to.not.be(null);
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

    groupsAndMembersAPI.getGroupAndMembersForList('GroupA', function (err, group) {
      expect(group).to.equal(GroupA);
      expect(group.members).to.not.be(null);
      expect(group.members.length).to.equal(1);
      expect(group.members[0]).to.equal(dummymember);
      done(err);
    });
  });

});

describe('Groups and Members API (addMembercountToGroup)', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('returns no group when the group is null', function (done) {
    groupsAndMembersAPI.addMembercountToGroup(null, function (err, group) {
      expect(group).to.not.exist();
      done(err);
    });
  });

  it('returns no group when the group is undefined', function (done) {
    groupsAndMembersAPI.addMembercountToGroup(undefined, function (err, group) {
      expect(group).to.not.exist();
      done(err);
    });
  });

  it('adds zero to group if there are no subscribers', function (done) {
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function (err, callback) { callback(null, []); });
    groupsAndMembersAPI.addMembercountToGroup({}, function (err, group) {
      expect(group.membercount).to.equal(0);
      done(err);
    });
  });

  it('adds the number of subscribers to the group', function (done) {
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function (err, callback) { callback(null, ['1', '2', '4']); });
    groupsAndMembersAPI.addMembercountToGroup({}, function (err, group) {
      expect(group.membercount).to.equal(3);
      done(err);
    });
  });

});

describe('Groups and Members API (addMembersToGroup)', function () {

  beforeEach(function () {
    sinon.stub(memberstore, 'allMembers', function (callback) { callback(null, null); });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('returns no group when the group is null', function (done) {
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function () { return undefined; });
    sinon.stub(membersAPI, 'getMembersForEMails', function () { return undefined; });

    groupsAndMembersAPI.addMembersToGroup(null, function (err, group) {
      expect(group).to.not.exist();
      done(err);
    });
  });

  it('returns no group when the group is undefined', function (done) {
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function () { return undefined; });
    sinon.stub(membersAPI, 'getMembersForEMails', function () { return undefined; });

    groupsAndMembersAPI.addMembersToGroup(undefined, function (err, group) {
      expect(group).to.not.exist();
      done(err);
    });
  });

  it('returns the group with an empty list of subscribed users when there are no subscribers', function (done) {
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function (err, callback) { callback(null, []); });
    sinon.stub(membersAPI, 'getMembersForEMails', function (member, callback) {
      callback(null, []);
    });

    groupsAndMembersAPI.addMembersToGroup(GroupA, function (err, group) {
      expect(group).to.equal(GroupA);
      expect(group.members).to.not.be(null);
      expect(group.members.length).to.equal(0);
      expect(group.membercount).to.equal(0);
      delete group.members;
      done(err);
    });
  });

  it('returns the group with a list of one subscribed user when there is one subscriber in sympa', function (done) {
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function (err, callback) { callback(null, ['user@email.com']); });
    sinon.stub(membersAPI, 'getMembersForEMails', function (member, callback) {
      callback(null, [dummymember]);
    });

    groupsAndMembersAPI.addMembersToGroup(GroupA, function (err, group) {
      expect(group).to.equal(GroupA);
      expect(group.members).to.not.be(null);
      expect(group.members.length).to.equal(1);
      expect(group.membercount).to.equal(1);
      expect(group.members[0]).to.equal(dummymember);
      delete group.members;
      done(err);
    });
  });

});

describe('Groups and Members API (memberIsInMemberList)', function () {

  it('returns false if the user id is undefined', function () {
    expect(groupsAndMembersAPI.memberIsInMemberList(undefined, [dummymember, dummymember2])).to.be(false);
  });

  it('returns false if the member list is empty', function () {
    expect(groupsAndMembersAPI.memberIsInMemberList('hada', [])).to.be(false);
  });

  it('returns false if the user is not in the member list', function () {
    expect(groupsAndMembersAPI.memberIsInMemberList('trallala', [dummymember])).to.be(false);
  });

  it('returns true if the user is in the member list', function () {
    expect(groupsAndMembersAPI.memberIsInMemberList('hada', [dummymember, dummymember2])).to.be(true);
  });
});

