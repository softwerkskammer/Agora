"use strict";

var sinon = require('sinon').sandbox.create();
var beans = require('../../testutil/configureForTest').get('beans');

var expect = require('must');

var Member = beans.get('member');
var Group = beans.get('group');
var memberstore = beans.get('memberstore');
var groupsAPI = beans.get('groupsAPI');
var groupsAndMembersAPI = beans.get('groupsAndMembersAPI');

var email = 'user@mail.com';
var groupA = new Group({id: 'groupA', organizers: []});
var member = new Member({id: 'id', email: email});

describe('Groups and Members API (Subscriptions)', function () {
  var getMemberForIdSpy;
  var addUserToListSpy;
  var removeUserFromListSpy;
  var subscribedGroups = [];

  beforeEach(function () {
    getMemberForIdSpy = sinon.stub(memberstore, 'getMemberForId', function (memberID, callback) { callback(null, member); });
    addUserToListSpy = sinon.stub(groupsAPI, 'addUserToList', function (email, list, callback) { callback(); });
    removeUserFromListSpy = sinon.stub(groupsAPI, 'removeUserFromList', function (email, list, callback) { callback(); });
    sinon.stub(groupsAPI, 'getSubscribedGroupsForUser', function (memberEmail, callback) { callback(null, subscribedGroups); });
  });

  afterEach(function () {
    sinon.restore();
    subscribedGroups = [];
    groupA.organizers = [];
  });

  describe('updateAdminlistSubscriptions', function () {

    it('subscribes a new contact person', function (done) {
      groupA.organizers.push(member.id());
      subscribedGroups.push(groupA);
      sinon.stub(groupsAPI, 'getSympaUsersOfList', function (listname, callback) { callback(null, []); });

      groupsAndMembersAPI.updateAdminlistSubscriptions(member.id(), function (err) {
        expect(addUserToListSpy.called, 'subscribe is called').to.be(true);
        expect(removeUserFromListSpy.called, 'unsubscribe is called').to.be(false);
        done(err);
      });
    });

    it('unsubscribes an ex-contact person', function (done) {
      sinon.stub(groupsAPI, 'getSympaUsersOfList', function (listname, callback) { callback(null, [email]); });

      groupsAndMembersAPI.updateAdminlistSubscriptions(member.id(), function (err) {
        expect(addUserToListSpy.called, 'subscribe is called').to.be(false);
        expect(removeUserFromListSpy.called, 'unsubscribe is called').to.be(true);
        done(err);
      });
    });

    it('does nothing if contact person is already subscribed', function (done) {
      groupA.organizers.push(member.id());
      subscribedGroups.push(groupA);
      sinon.stub(groupsAPI, 'getSympaUsersOfList', function (listname, callback) { callback(null, [email]); });

      groupsAndMembersAPI.updateAdminlistSubscriptions(member.id(), function (err) {
        expect(addUserToListSpy.called, 'subscribe is called').to.be(false);
        expect(removeUserFromListSpy.called, 'unsubscribe is called').to.be(false);
        done(err);
      });
    });

    it('does nothing if non-contact person is not subscribed', function (done) {
      sinon.stub(groupsAPI, 'getSympaUsersOfList', function (listname, callback) { callback(null, []); });

      groupsAndMembersAPI.updateAdminlistSubscriptions(member.id(), function (err) {
        expect(addUserToListSpy.called, 'subscribe is called').to.be(false);
        expect(removeUserFromListSpy.called, 'unsubscribe is called').to.be(false);
        done(err);
      });
    });

  });

  describe('saveGroup', function () {
    var createOrSaveGroupSpy;

    beforeEach(function () {
      subscribedGroups.push(groupA);
      createOrSaveGroupSpy = sinon.stub(groupsAPI, 'createOrSaveGroup', function (group, callback) { callback(); });
      sinon.stub(groupsAPI, 'getSympaUsersOfList', function (listname, callback) { callback(null, []); });
    });

    it('calls groupAPI to perform saving', function (done) {
      groupsAndMembersAPI.saveGroup(groupA, function (err) {
        expect(createOrSaveGroupSpy.called, 'save in GroupsAPI is called').to.be(true);
        done(err);
      });
    });

    it('calls membersAPI to retrieve member if in organizers (and subscribes)', function (done) {
      groupA.organizers.push('id');

      groupsAndMembersAPI.saveGroup(groupA, function (err) {
        expect(getMemberForIdSpy.called, 'getMemberForID in MembersAPI is called').to.be(true);
        expect(addUserToListSpy.called, 'subscribe in GroupsAPI is called').to.be(true);
        expect(addUserToListSpy.args[0][1]).to.equal('admins');
        done(err);
      });
    });

    it('does not call membersAPI to retrieve member if not in organizers (and does not subscribe)', function (done) {
      groupsAndMembersAPI.saveGroup(groupA, function (err) {
        expect(getMemberForIdSpy.called, 'getMemberForID in MembersAPI is called').to.be(false);
        expect(addUserToListSpy.called, 'subscribe in GroupsAPI is called').to.be(false);
        done(err);
      });
    });

  });

  describe('updateSubscriptions', function () {
    var updateSubscriptionsSpy;
    var sympaUsers = [];

    beforeEach(function () {
      subscribedGroups.push(groupA);
      updateSubscriptionsSpy = sinon.stub(groupsAPI, 'updateSubscriptions', function (memberEmail, oldEmail, subscriptions, callback) { callback(); });
      sinon.stub(groupsAPI, 'getSympaUsersOfList', function (listname, callback) { callback(null, sympaUsers); });
    });

    it('calls groupAPI to perform saving', function (done) {
      groupsAndMembersAPI.updateSubscriptions(member, '', [], function (err) {
        expect(updateSubscriptionsSpy.called, 'updateSubscriptions in GroupsAPI is called').to.be(true);
        done(err);
      });
    });

    it('subscribes the member to the admin list if is organizer', function (done) {
      groupA.organizers.push('id');

      groupsAndMembersAPI.updateSubscriptions(member, '', ['groupA'], function (err) {
        expect(addUserToListSpy.called, 'subscribe in GroupsAPI is called').to.be(true);
        expect(addUserToListSpy.args[0][1]).to.equal('admins');
        done(err);
      });
    });

    it('unsubscribes the member from the admin list if not organizer anymore', function (done) {
      sympaUsers.push(email);

      groupsAndMembersAPI.updateSubscriptions(member, '', ['groupA'], function (err) {
        expect(removeUserFromListSpy.called, 'subscribe in GroupsAPI is called').to.be(true);
        expect(removeUserFromListSpy.args[0][1]).to.equal('admins');
        done(err);
      });
    });

  });

  describe('(un)subscribe one group', function () {
    var sympaUsers = [];

    beforeEach(function () {
      sinon.stub(groupsAPI, 'getSympaUsersOfList', function (listname, callback) { callback(null, sympaUsers); });
    });

    afterEach(function () {
      sympaUsers = [];
    });

    it('calls groupAPI to perform saving and subscribes only to groupA', function (done) {
      groupsAndMembersAPI.subscribeMemberToGroup(member, 'groupA', function (err) {
        expect(addUserToListSpy.calledOnce, 'subscribe in GroupsAPI is called').to.be(true);
        expect(addUserToListSpy.args[0][1]).to.equal('groupA');
        done(err);
      });
    });

    it('calls groupAPI to perform saving and subscribes also to group "admins"', function (done) {
      groupA.organizers.push('id');
      subscribedGroups.push(groupA);
      groupsAndMembersAPI.subscribeMemberToGroup(member, 'groupA', function (err) {
        expect(addUserToListSpy.calledTwice, 'subscribe in GroupsAPI is called twice').to.be(true);
        expect(addUserToListSpy.args[0][1]).to.equal('groupA');
        expect(addUserToListSpy.args[1][1]).to.equal('admins'); // 2nd call
        done(err);
      });
    });

    it('calls groupAPI to perform saving and unsubscribes only from groupA', function (done) {
      groupsAndMembersAPI.unsubscribeMemberFromGroup(member, 'groupA', function (err) {
        expect(removeUserFromListSpy.calledOnce, 'unsubscribe in GroupsAPI is called').to.be(true);
        expect(removeUserFromListSpy.args[0][1]).to.equal('groupA');
        done(err);
      });
    });

    it('calls groupAPI to perform saving and unsubscribes also from group "admins"', function (done) {
      groupA.organizers.push('id');
      sympaUsers.push(email);
      groupsAndMembersAPI.unsubscribeMemberFromGroup(member, 'groupA', function (err) {
        expect(removeUserFromListSpy.calledTwice, 'unsubscribe in GroupsAPI is called twice').to.be(true);
        expect(removeUserFromListSpy.args[0][1]).to.equal('groupA');
        expect(removeUserFromListSpy.args[1][1]).to.equal('admins'); // 2nd call
        done(err);
      });
    });

  });

});

