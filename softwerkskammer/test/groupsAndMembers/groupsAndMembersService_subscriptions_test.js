'use strict';

var sinon = require('sinon').sandbox.create();
var beans = require('../../testutil/configureForTest').get('beans');

var expect = require('must-dist');

var Member = beans.get('member');
var Group = beans.get('group');
var memberstore = beans.get('memberstore');
var groupsService = beans.get('groupsService');
var groupsAndMembersService = beans.get('groupsAndMembersService');

var email = 'user@mail.com';
var groupA = new Group({id: 'groupA', organizers: []});
var member = new Member({id: 'id', email: email});

describe('Groups and Members Service (Subscriptions)', function () {
  var getMemberForIdSpy;
  var addUserToListSpy;
  var removeUserFromListSpy;
  var subscribedGroups = [];

  beforeEach(function () {
    getMemberForIdSpy = sinon.stub(memberstore, 'getMemberForId', function (memberID, callback) { callback(null, member); });
    addUserToListSpy = sinon.stub(groupsService, 'addUserToList', function (someEmail, list, callback) { callback(); });
    removeUserFromListSpy = sinon.stub(groupsService, 'removeUserFromList', function (someEmail, list, callback) { callback(); });
    sinon.stub(groupsService, 'getSubscribedGroupsForUser', function (memberEmail, callback) { callback(null, subscribedGroups); });
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
      sinon.stub(groupsService, 'getMailinglistUsersOfList', function (listname, callback) { callback(null, []); });

      groupsAndMembersService.updateAdminlistSubscriptions(member.id(), function (err) {
        expect(addUserToListSpy.called, 'subscribe is called').to.be(true);
        expect(removeUserFromListSpy.called, 'unsubscribe is called').to.be(false);
        done(err);
      });
    });

    it('unsubscribes an ex-contact person', function (done) {
      sinon.stub(groupsService, 'getMailinglistUsersOfList', function (listname, callback) { callback(null, [email]); });

      groupsAndMembersService.updateAdminlistSubscriptions(member.id(), function (err) {
        expect(addUserToListSpy.called, 'subscribe is called').to.be(false);
        expect(removeUserFromListSpy.called, 'unsubscribe is called').to.be(true);
        done(err);
      });
    });

    it('does nothing if contact person is already subscribed', function (done) {
      groupA.organizers.push(member.id());
      subscribedGroups.push(groupA);
      sinon.stub(groupsService, 'getMailinglistUsersOfList', function (listname, callback) { callback(null, [email]); });

      groupsAndMembersService.updateAdminlistSubscriptions(member.id(), function (err) {
        expect(addUserToListSpy.called, 'subscribe is called').to.be(false);
        expect(removeUserFromListSpy.called, 'unsubscribe is called').to.be(false);
        done(err);
      });
    });

    it('does nothing if non-contact person is not subscribed', function (done) {
      sinon.stub(groupsService, 'getMailinglistUsersOfList', function (listname, callback) { callback(null, []); });

      groupsAndMembersService.updateAdminlistSubscriptions(member.id(), function (err) {
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
      createOrSaveGroupSpy = sinon.stub(groupsService, 'createOrSaveGroup', function (group, callback) { callback(); });
      sinon.stub(groupsService, 'getMailinglistUsersOfList', function (listname, callback) { callback(null, []); });
    });

    it('calls groupService to perform saving', function (done) {
      groupsAndMembersService.saveGroup(groupA, function (err) {
        expect(createOrSaveGroupSpy.called, 'save in GroupsService is called').to.be(true);
        done(err);
      });
    });

    it('calls membersService to retrieve member if in organizers (and subscribes)', function (done) {
      groupA.organizers.push('id');

      groupsAndMembersService.saveGroup(groupA, function (err) {
        expect(getMemberForIdSpy.called, 'getMemberForID in MembersService is called').to.be(true);
        expect(addUserToListSpy.called, 'subscribe in GroupsService is called').to.be(true);
        expect(addUserToListSpy.args[0][1]).to.equal('admins');
        done(err);
      });
    });

    it('does not call membersService to retrieve member if not in organizers (and does not subscribe)', function (done) {
      groupsAndMembersService.saveGroup(groupA, function (err) {
        expect(getMemberForIdSpy.called, 'getMemberForID in MembersService is called').to.be(false);
        expect(addUserToListSpy.called, 'subscribe in GroupsService is called').to.be(false);
        done(err);
      });
    });

  });

  describe('updateSubscriptions', function () {
    var updateSubscriptionsSpy;
    var mailinglistUsers = [];

    beforeEach(function () {
      subscribedGroups.push(groupA);
      updateSubscriptionsSpy = sinon.stub(groupsService, 'updateSubscriptions', function (memberEmail, oldEmail, subscriptions, callback) { callback(); });
      sinon.stub(groupsService, 'getMailinglistUsersOfList', function (listname, callback) { callback(null, mailinglistUsers); });
    });

    it('calls groupService to perform saving', function (done) {
      groupsAndMembersService.updateSubscriptions(member, '', [], function (err) {
        expect(updateSubscriptionsSpy.called, 'updateSubscriptions in GroupsService is called').to.be(true);
        done(err);
      });
    });

    it('subscribes the member to the admin list if is organizer', function (done) {
      groupA.organizers.push('id');

      groupsAndMembersService.updateSubscriptions(member, '', ['groupA'], function (err) {
        expect(addUserToListSpy.called, 'subscribe in GroupsService is called').to.be(true);
        expect(addUserToListSpy.args[0][1]).to.equal('admins');
        done(err);
      });
    });

    it('unsubscribes the member from the admin list if not organizer anymore', function (done) {
      mailinglistUsers.push(email);

      groupsAndMembersService.updateSubscriptions(member, '', ['groupA'], function (err) {
        expect(removeUserFromListSpy.called, 'subscribe in GroupsService is called').to.be(true);
        expect(removeUserFromListSpy.args[0][1]).to.equal('admins');
        done(err);
      });
    });

  });

  describe('(un)subscribe one group', function () {
    var mailinglistUsers = [];

    beforeEach(function () {
      sinon.stub(groupsService, 'getMailinglistUsersOfList', function (listname, callback) { callback(null, mailinglistUsers); });
    });

    afterEach(function () {
      mailinglistUsers = [];
    });

    it('calls groupService to perform saving and subscribes only to groupA', function (done) {
      groupsAndMembersService.subscribeMemberToGroup(member, 'groupA', function (err) {
        expect(addUserToListSpy.calledOnce, 'subscribe in GroupsService is called').to.be(true);
        expect(addUserToListSpy.args[0][1]).to.equal('groupA');
        done(err);
      });
    });

    it('calls groupService to perform saving and subscribes also to group "admins"', function (done) {
      groupA.organizers.push('id');
      subscribedGroups.push(groupA);
      groupsAndMembersService.subscribeMemberToGroup(member, 'groupA', function (err) {
        expect(addUserToListSpy.calledTwice, 'subscribe in GroupsService is called twice').to.be(true);
        expect(addUserToListSpy.args[0][1]).to.equal('groupA');
        expect(addUserToListSpy.args[1][1]).to.equal('admins'); // 2nd call
        done(err);
      });
    });

    it('calls groupService to perform saving and unsubscribes only from groupA', function (done) {
      groupsAndMembersService.unsubscribeMemberFromGroup(member, 'groupA', function (err) {
        expect(removeUserFromListSpy.calledOnce, 'unsubscribe in GroupsService is called').to.be(true);
        expect(removeUserFromListSpy.args[0][1]).to.equal('groupA');
        done(err);
      });
    });

    it('calls groupService to perform saving and unsubscribes also from group "admins"', function (done) {
      groupA.organizers.push('id');
      mailinglistUsers.push(email);
      groupsAndMembersService.unsubscribeMemberFromGroup(member, 'groupA', function (err) {
        expect(removeUserFromListSpy.calledTwice, 'unsubscribe in GroupsService is called twice').to.be(true);
        expect(removeUserFromListSpy.args[0][1]).to.equal('groupA');
        expect(removeUserFromListSpy.args[1][1]).to.equal('admins'); // 2nd call
        done(err);
      });
    });

  });

});

