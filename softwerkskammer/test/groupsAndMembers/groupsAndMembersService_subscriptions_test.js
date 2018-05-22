'use strict';

const sinon = require('sinon').createSandbox();
const beans = require('../../testutil/configureForTest').get('beans');

const expect = require('must-dist');

const Member = beans.get('member');
const Group = beans.get('group');
const memberstore = beans.get('memberstore');
const groupsService = beans.get('groupsService');
const groupsAndMembersService = beans.get('groupsAndMembersService');

const email = 'user@mail.com';
const groupA = new Group({id: 'groupA', organizers: []});
const member = new Member({id: 'id', email});

describe('Groups and Members Service (Subscriptions)', () => {
  let getMemberForIdSpy;
  let addUserToListSpy;
  let removeUserFromListSpy;
  let subscribedGroups = [];

  beforeEach(() => {
    getMemberForIdSpy = sinon.stub(memberstore, 'getMemberForId').callsFake((memberID, callback) => { callback(null, member); });
    addUserToListSpy = sinon.stub(groupsService, 'addUserToList').callsFake((someEmail, list, callback) => { callback(); });
    removeUserFromListSpy = sinon.stub(groupsService, 'removeUserFromList').callsFake((someEmail, list, callback) => { callback(); });
    sinon.stub(groupsService, 'getSubscribedGroupsForUser').callsFake((memberEmail, callback) => { callback(null, subscribedGroups); });
  });

  afterEach(() => {
    sinon.restore();
    subscribedGroups = [];
    groupA.organizers = [];
  });

  describe('updateAdminlistSubscriptions', () => {

    it('subscribes a new contact person', done => {
      groupA.organizers.push(member.id());
      subscribedGroups.push(groupA);
      sinon.stub(groupsService, 'getMailinglistUsersOfList').callsFake((listname, callback) => { callback(null, []); });

      groupsAndMembersService.updateAdminlistSubscriptions(member.id(), err => {
        expect(addUserToListSpy.called, 'subscribe is called').to.be(true);
        expect(removeUserFromListSpy.called, 'unsubscribe is called').to.be(false);
        done(err);
      });
    });

    it('unsubscribes an ex-contact person', done => {
      sinon.stub(groupsService, 'getMailinglistUsersOfList').callsFake((listname, callback) => { callback(null, [email]); });

      groupsAndMembersService.updateAdminlistSubscriptions(member.id(), err => {
        expect(addUserToListSpy.called, 'subscribe is called').to.be(false);
        expect(removeUserFromListSpy.called, 'unsubscribe is called').to.be(true);
        done(err);
      });
    });

    it('does nothing if contact person is already subscribed', done => {
      groupA.organizers.push(member.id());
      subscribedGroups.push(groupA);
      sinon.stub(groupsService, 'getMailinglistUsersOfList').callsFake((listname, callback) => { callback(null, [email]); });

      groupsAndMembersService.updateAdminlistSubscriptions(member.id(), err => {
        expect(addUserToListSpy.called, 'subscribe is called').to.be(false);
        expect(removeUserFromListSpy.called, 'unsubscribe is called').to.be(false);
        done(err);
      });
    });

    it('does nothing if non-contact person is not subscribed', done => {
      sinon.stub(groupsService, 'getMailinglistUsersOfList').callsFake((listname, callback) => { callback(null, []); });

      groupsAndMembersService.updateAdminlistSubscriptions(member.id(), err => {
        expect(addUserToListSpy.called, 'subscribe is called').to.be(false);
        expect(removeUserFromListSpy.called, 'unsubscribe is called').to.be(false);
        done(err);
      });
    });

  });

  describe('saveGroup', () => {
    let createOrSaveGroupSpy;

    beforeEach(() => {
      subscribedGroups.push(groupA);
      createOrSaveGroupSpy = sinon.stub(groupsService, 'createOrSaveGroup').callsFake((group, callback) => { callback(); });
      sinon.stub(groupsService, 'getMailinglistUsersOfList').callsFake((listname, callback) => { callback(null, []); });
    });

    it('calls groupService to perform saving', done => {
      groupsAndMembersService.saveGroup(groupA, err => {
        expect(createOrSaveGroupSpy.called, 'save in GroupsService is called').to.be(true);
        done(err);
      });
    });

    it('calls membersService to retrieve member if in organizers (and subscribes)', done => {
      groupA.organizers.push('id');

      groupsAndMembersService.saveGroup(groupA, err => {
        expect(getMemberForIdSpy.called, 'getMemberForID in MembersService is called').to.be(true);
        expect(addUserToListSpy.called, 'subscribe in GroupsService is called').to.be(true);
        expect(addUserToListSpy.args[0][1]).to.equal('admins');
        done(err);
      });
    });

    it('does not call membersService to retrieve member if not in organizers (and does not subscribe)', done => {
      groupsAndMembersService.saveGroup(groupA, err => {
        expect(getMemberForIdSpy.called, 'getMemberForID in MembersService is called').to.be(false);
        expect(addUserToListSpy.called, 'subscribe in GroupsService is called').to.be(false);
        done(err);
      });
    });

  });

  describe('updateSubscriptions', () => {
    let updateSubscriptionsSpy;
    const mailinglistUsers = [];

    beforeEach(() => {
      subscribedGroups.push(groupA);
      updateSubscriptionsSpy = sinon.stub(groupsService, 'updateSubscriptions').callsFake((memberEmail, oldEmail, subscriptions, callback) => { callback(); });
      sinon.stub(groupsService, 'getMailinglistUsersOfList').callsFake((listname, callback) => { callback(null, mailinglistUsers); });
    });

    it('calls groupService to perform saving', done => {
      groupsAndMembersService.updateSubscriptions(member, '', [], err => {
        expect(updateSubscriptionsSpy.called, 'updateSubscriptions in GroupsService is called').to.be(true);
        done(err);
      });
    });

    it('subscribes the member to the admin list if is organizer', done => {
      groupA.organizers.push('id');

      groupsAndMembersService.updateSubscriptions(member, '', ['groupA'], err => {
        expect(addUserToListSpy.called, 'subscribe in GroupsService is called').to.be(true);
        expect(addUserToListSpy.args[0][1]).to.equal('admins');
        done(err);
      });
    });

    it('unsubscribes the member from the admin list if not organizer anymore', done => {
      mailinglistUsers.push(email);

      groupsAndMembersService.updateSubscriptions(member, '', ['groupA'], err => {
        expect(removeUserFromListSpy.called, 'subscribe in GroupsService is called').to.be(true);
        expect(removeUserFromListSpy.args[0][1]).to.equal('admins');
        done(err);
      });
    });

  });

  describe('(un)subscribe one group', () => {
    let mailinglistUsers = [];

    beforeEach(() => {
      sinon.stub(groupsService, 'getMailinglistUsersOfList').callsFake((listname, callback) => { callback(null, mailinglistUsers); });
    });

    afterEach(() => {
      mailinglistUsers = [];
    });

    it('calls groupService to perform saving and subscribes only to groupA', done => {
      groupsAndMembersService.subscribeMemberToGroup(member, 'groupA', err => {
        expect(addUserToListSpy.calledOnce, 'subscribe in GroupsService is called').to.be(true);
        expect(addUserToListSpy.args[0][1]).to.equal('groupA');
        done(err);
      });
    });

    it('calls groupService to perform saving and subscribes also to group "admins"', done => {
      groupA.organizers.push('id');
      subscribedGroups.push(groupA);
      groupsAndMembersService.subscribeMemberToGroup(member, 'groupA', err => {
        expect(addUserToListSpy.calledTwice, 'subscribe in GroupsService is called twice').to.be(true);
        expect(addUserToListSpy.args[0][1]).to.equal('groupA');
        expect(addUserToListSpy.args[1][1]).to.equal('admins'); // 2nd call
        done(err);
      });
    });

    it('calls groupService to perform saving and unsubscribes only from groupA', done => {
      groupsAndMembersService.unsubscribeMemberFromGroup(member, 'groupA', err => {
        expect(removeUserFromListSpy.calledOnce, 'unsubscribe in GroupsService is called').to.be(true);
        expect(removeUserFromListSpy.args[0][1]).to.equal('groupA');
        done(err);
      });
    });

    it('calls groupService to perform saving and unsubscribes also from group "admins"', done => {
      groupA.organizers.push('id');
      mailinglistUsers.push(email);
      groupsAndMembersService.unsubscribeMemberFromGroup(member, 'groupA', err => {
        expect(removeUserFromListSpy.calledTwice, 'unsubscribe in GroupsService is called twice').to.be(true);
        expect(removeUserFromListSpy.args[0][1]).to.equal('groupA');
        expect(removeUserFromListSpy.args[1][1]).to.equal('admins'); // 2nd call
        done(err);
      });
    });

  });

});

