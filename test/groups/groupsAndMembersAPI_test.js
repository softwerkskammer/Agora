"use strict";

var sinon = require('sinon').sandbox.create();
var beans = require('../configureForTest').get('beans');

var expect = require('chai').expect;

var Member = beans.get('member');

var dummymember = new Member().initFromSessionUser({authenticationId: 'hada'});
var dummymember2 = new Member().initFromSessionUser({authenticationId: 'hada2'});

var Group = beans.get('group');

var GroupA = new Group({id: 'GroupA', longName: 'Gruppe A', description: 'Dies ist Gruppe A.', type: 'Themengruppe'});
var GroupB = new Group({id: 'GroupB', longName: 'Gruppe B', description: 'Dies ist Gruppe B.', type: 'Regionalgruppe'});

var membersAPI = beans.get('membersAPI');
var groupsAPI = beans.get('groupsAPI');

var systemUnderTest = beans.get('groupsAndMembersAPI');

describe('Groups and Members API (getUserWithHisGroups or getMemberWithHisGroupsByMemberId)', function () {

  afterEach(function () {
    sinon.restore();
  });

  it('returns no member when there is no member for the given nickname', function (done) {
    sinon.stub(membersAPI, 'getMember', function (nickname, callback) {
      callback(null, null);
    });

    systemUnderTest.getUserWithHisGroups('nickname', function (err, member) {
      expect(member).to.not.exist;
      done(err);
    });
  });

  it('returns the member and his groups when there is a member for the given nickname', function (done) {
    sinon.stub(membersAPI, 'getMember', function (nickname, callback) {
      callback(null, dummymember);
    });
    sinon.stub(groupsAPI, 'getSubscribedGroupsForUser', function (userMail, globalCallback) {
      globalCallback(null, [GroupA, GroupB]);
    });

    systemUnderTest.getUserWithHisGroups('nickname', function (err, member) {
      expect(member).to.equal(dummymember);
      expect(member.subscribedGroups).to.not.be.null;
      expect(member.subscribedGroups.length).to.equal(2);
      expect(member.subscribedGroups[0]).to.equal(GroupA);
      expect(member.subscribedGroups[1]).to.equal(GroupB);
      done(err);
    });
  });

  it('returns no member when there is no member for the given memberID', function (done) {
    sinon.stub(membersAPI, 'getMemberForId', function (memberID, callback) {
      callback(null, null);
    });

    systemUnderTest.getMemberWithHisGroupsByMemberId('id', function (err, member) {
      expect(member).to.not.exist;
      done(err);
    });
  });

  it('returns the member and his groups when there is a member for the given memberID', function (done) {
    sinon.stub(membersAPI, 'getMemberForId', function (memberID, callback) {
      callback(null, dummymember);
    });
    sinon.stub(groupsAPI, 'getSubscribedGroupsForUser', function (userMail, globalCallback) {
      globalCallback(null, [GroupA, GroupB]);
    });

    systemUnderTest.getMemberWithHisGroupsByMemberId('id', function (err, member) {
      expect(member).to.equal(dummymember);
      expect(member.subscribedGroups).to.not.be.null;
      expect(member.subscribedGroups.length).to.equal(2);
      expect(member.subscribedGroups[0]).to.equal(GroupA);
      expect(member.subscribedGroups[1]).to.equal(GroupB);
      done(err);
    });
  });
});

describe('Groups and Members API (getGroupAndMembersForList)', function () {

  beforeEach(function () {
    sinon.stub(membersAPI, 'allMembers', function (callback) { callback(null, null); });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('returns no group when there is no group and no sympa-list', function (done) {
    sinon.stub(membersAPI, 'getMembersForEMails', function (member, callback) { callback(); });
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function (err, callback) { callback(null, []); });
    sinon.stub(groupsAPI, 'getGroup', function (groupname, callback) { callback(null, null); });

    systemUnderTest.getGroupAndMembersForList('unbekannteListe', function (err, group) {
      expect(!!group).to.be.false;
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

    systemUnderTest.getGroupAndMembersForList('sympaListWithoutGroup', function (err, group) {
      expect(!!group).to.be.false;
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

describe('Groups and Members API (addMembercountToGroup)', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('returns no group when the group is null', function (done) {
    systemUnderTest.addMembercountToGroup(null, function (err, group) {
      expect(!!group).to.be.false;
      done(err);
    });
  });

  it('returns no group when the group is undefined', function (done) {
    systemUnderTest.addMembercountToGroup(undefined, function (err, group) {
      expect(!!group).to.be.false;
      done(err);
    });
  });

  it('adds zero to group if there are no subscribers', function (done) {
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function (err, callback) { callback(null, []); });
    systemUnderTest.addMembercountToGroup({}, function (err, group) {
      expect(group.membercount).to.equal(0);
      done(err);
    });
  });

  it('adds the number of subscribers to the group', function (done) {
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function (err, callback) { callback(null, ['1', '2', '4']); });
    systemUnderTest.addMembercountToGroup({}, function (err, group) {
      expect(group.membercount).to.equal(3);
      done(err);
    });
  });

});

describe('Groups and Members API (addMembersToGroup)', function () {

  beforeEach(function () {
    sinon.stub(membersAPI, 'allMembers', function (callback) { callback(null, null); });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('returns no group when the group is null', function (done) {
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function () {});
    sinon.stub(membersAPI, 'getMembersForEMails', function () {});

    systemUnderTest.addMembersToGroup(null, function (err, group) {
      expect(!!group).to.be.false;
      done(err);
    });
  });

  it('returns no group when the group is undefined', function (done) {
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function () {});
    sinon.stub(membersAPI, 'getMembersForEMails', function () {});

    systemUnderTest.addMembersToGroup(undefined, function (err, group) {
      expect(!!group).to.be.false;
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

    systemUnderTest.addMembersToGroup(GroupA, function (err, group) {
      expect(group).to.equal(GroupA);
      expect(group.members).to.not.be.null;
      expect(group.members.length).to.equal(1);
      expect(group.membercount).to.equal(1);
      expect(group.members[0]).to.equal(dummymember);
      delete group.members;
      done(err);
    });
  });

});

describe('Groups and Members API (userIsInMemberList)', function () {

  it('returns false if the user id is undefined', function () {
    var result = systemUnderTest.userIsInMemberList(undefined, [dummymember, dummymember2]);

    expect(result).to.be.false;
  });

  it('returns false if the member list is empty', function () {
    var result = systemUnderTest.userIsInMemberList('hada', []);

    expect(result).to.be.false;
  });

  it('returns false if the user is not in the member list', function () {
    var result = systemUnderTest.userIsInMemberList('trallala', [dummymember]);

    expect(result).to.be.false;
  });

  it('returns true if the user is in the member list', function () {
    var result = systemUnderTest.userIsInMemberList('hada', [dummymember, dummymember2]);

    expect(result).to.be.true;
  });
});

describe('Groups and Members API (updateAdminlistSubscriptions)', function () {
  var email = 'user@mail.com';
  var groupA;
  var member;

  var subscribeSpy;
  var unsubscribeSpy;

  beforeEach(function () {
    groupA = new Group({id: 'groupA', organizers: []});
    member = new Member({id: 'id', email: email});
    member.subscribedGroups = [groupA];
    subscribeSpy = sinon.stub(groupsAPI, 'addUserToList', function (email, list, callback) { callback(); });
    unsubscribeSpy = sinon.stub(groupsAPI, 'removeUserFromList', function (email, list, callback) { callback(); });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('subscribes a new contact person', function (done) {
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function (listname, callback) { callback(null, []); });
    groupA.organizers.push(member.id());

    systemUnderTest.updateAdminlistSubscriptions(member, function (err) {
      expect(subscribeSpy.called, 'subscribe is called').to.be.true;
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be.false;
      done(err);
    });
  });

  it('unsubscribes an ex-contact person', function (done) {
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function (listname, callback) { callback(null, [email]); });

    systemUnderTest.updateAdminlistSubscriptions(member, function (err) {
      expect(subscribeSpy.called, 'subscribe is called').to.be.false;
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be.true;
      done(err);
    });
  });

  it('does nothing if member is not correctly filled with subscribedGroups', function (done) {
    delete member.subscribedGroups;
    systemUnderTest.updateAdminlistSubscriptions(member, function (err) {
      expect(subscribeSpy.called, 'subscribe is called').to.be.false;
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be.false;
      done(err);
    });
  });

  it('does nothing if contact person is already subscribed', function (done) {
    groupA.organizers.push(member.id());
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function (listname, callback) { callback(null, [email]); });

    systemUnderTest.updateAdminlistSubscriptions(member, function (err) {
      expect(subscribeSpy.called, 'subscribe is called').to.be.false;
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be.false;
      done(err);
    });
  });

  it('does nothing if non-contact person is not subscribed', function (done) {
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function (listname, callback) { callback(null, []); });

    systemUnderTest.updateAdminlistSubscriptions(member, function (err) {
      expect(subscribeSpy.called, 'subscribe is called').to.be.false;
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be.false;
      done(err);
    });
  });

});

describe('Groups and Members API (saveGroup)', function () {
  var email = 'user@mail.com';
  var groupA = new Group({id: 'groupA', organizers: []});
  var member = new Member({id: 'id', email: email});
  var createOrSaveGroupSpy;
  var getMemberForIdSpy;
  var addUserToListSpy;

  beforeEach(function () {
    sinon.stub(groupsAPI, 'getSubscribedGroupsForUser', function (memberEmail, callback) { callback(null, [groupA]); });
    createOrSaveGroupSpy = sinon.stub(groupsAPI, 'createOrSaveGroup', function (group, callback) { callback(); });
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function (listname, callback) { callback(null, []); });
    getMemberForIdSpy = sinon.stub(membersAPI, 'getMemberForId', function (memberID, callback) { callback(null, member); });
    addUserToListSpy = sinon.stub(groupsAPI, 'addUserToList', function (email, list, callback) { callback(); });
  });

  afterEach(function () {
    sinon.restore();
    groupA.organizers = [];
  });

  it('calls groupAPI to perform saving', function (done) {
    systemUnderTest.saveGroup(groupA, function (err) {
      expect(createOrSaveGroupSpy.called, 'save in GroupsAPI is called').to.be.true;
      done(err);
    });
  });

  it('calls membersAPI to retrieve member if in organizers (and subscribes)', function (done) {
    groupA.organizers.push('id');

    systemUnderTest.saveGroup(groupA, function (err) {
      expect(getMemberForIdSpy.called, 'getMemberForID in MembersAPI is called').to.be.true;
      expect(addUserToListSpy.called, 'subscribe in GroupsAPI is called').to.be.true;
      done(err);
    });
  });

  it('does not call membersAPI to retrieve member if not in organizers (and does not subscribe)', function (done) {
    systemUnderTest.saveGroup(groupA, function (err) {
      expect(getMemberForIdSpy.called, 'getMemberForID in MembersAPI is called').to.be.false;
      expect(addUserToListSpy.called, 'subscribe in GroupsAPI is called').to.be.false;
      done(err);
    });
  });

});

describe('Groups and Members API (updateSubscriptions)', function () {
  var email = 'user@mail.com';
  var groupA = new Group({id: 'groupA', organizers: []});
  var member = new Member({id: 'id', email: email});
  var updateSubscriptionsSpy;
  var getMemberForIdSpy;
  var addUserToListSpy;
  var removeUserFromListSpy;
  var sympaUsers = [];

  beforeEach(function () {
    sinon.stub(groupsAPI, 'getSubscribedGroupsForUser', function (memberEmail, callback) { callback(null, [groupA]); });
    updateSubscriptionsSpy = sinon.stub(groupsAPI, 'updateSubscriptions', function (memberEmail, oldEmail, subscriptions, callback) { callback(); });
    sinon.stub(groupsAPI, 'getSympaUsersOfList', function (listname, callback) { callback(null, sympaUsers); });
    getMemberForIdSpy = sinon.stub(membersAPI, 'getMemberForId', function (memberID, callback) { callback(null, member); });
    addUserToListSpy = sinon.stub(groupsAPI, 'addUserToList', function (email, list, callback) { callback(); });
    removeUserFromListSpy = sinon.stub(groupsAPI, 'removeUserFromList', function (email, list, callback) { callback(); });
  });

  afterEach(function () {
    sinon.restore();
    groupA.organizers = [];
  });

  it('calls groupAPI to perform saving', function (done) {
    systemUnderTest.updateSubscriptions(member, '', [], function (err) {
      expect(updateSubscriptionsSpy.called, 'updateSubscriptions in GroupsAPI is called').to.be.true;
      done(err);
    });
  });

  it('subscribes the member to the admin list if is organizer', function (done) {
    groupA.organizers.push('id');

    systemUnderTest.updateSubscriptions(member, '', ['groupA'], function (err) {
      expect(addUserToListSpy.called, 'subscribe in GroupsAPI is called').to.be.true;
      expect(addUserToListSpy.args[0][1]).to.equal('admins');
      done(err);
    });
  });

  it('unsubscribes the member from the admin list if not organizer anymore', function (done) {
    sympaUsers.push(email);

    systemUnderTest.updateSubscriptions(member, '', ['groupA'], function (err) {
      expect(removeUserFromListSpy.called, 'subscribe in GroupsAPI is called').to.be.true;
      expect(removeUserFromListSpy.args[0][1]).to.equal('admins');
      done(err);
    });
  });

});
