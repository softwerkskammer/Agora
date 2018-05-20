'use strict';

const sinon = require('sinon').sandbox.create();
const beans = require('../../testutil/configureForTest').get('beans');

const Member = beans.get('member');

const dummymember = new Member().initFromSessionUser({authenticationId: 'hada', profile: {emails: [{value: 'email'}]}});

const Group = beans.get('group');

const GroupA = new Group({id: 'GroupA', longName: 'Gruppe A', description: 'Dies ist Gruppe A.', type: 'Themengruppe'});
const GroupB = new Group({id: 'GroupB', longName: 'Gruppe B', description: 'Dies ist Gruppe B.', type: 'Regionalgruppe'});

const memberstore = beans.get('memberstore');
const groupsService = beans.get('groupsService');

const groupsAndMembersService = beans.get('groupsAndMembersService');

describe('Groups and Members Service (member deletion)', () => {
  let removeUserFromListSpy;
  let removeMemberSpy;

  beforeEach(() => {
    sinon.stub(memberstore, 'getMember').callsFake((nick, callback) => {
      callback(null, dummymember);
    });
    sinon.stub(memberstore, 'getMemberForId').callsFake((memberID, callback) => {
      callback(null, dummymember);
    });
    sinon.stub(groupsService, 'getMailinglistUsersOfList').callsFake((email, callback) => {
      callback(null);
    });
    removeUserFromListSpy = sinon.stub(groupsService, 'removeUserFromList').callsFake((someEmail, list, callback) => {
      callback();
    });
    removeMemberSpy = sinon.stub(memberstore, 'removeMember').callsFake((member, callback) => {
      callback();
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('removes the groups membership and kills the member', done => {
    sinon.stub(groupsService, 'getSubscribedGroupsForUser').callsFake((email, callback) => {
      callback(null, [GroupA, GroupB]);
    });

    groupsAndMembersService.removeMember('nick', err => {
      sinon.assert.calledWith(removeUserFromListSpy.firstCall, 'email', 'groupa');
      sinon.assert.calledWith(removeUserFromListSpy.secondCall, 'email', 'groupb');
      sinon.assert.calledWith(removeMemberSpy, dummymember);
      done(err);
    });
  });

  it('does not call the groups when no groups subscribed but kills the member', done => {
    sinon.stub(groupsService, 'getSubscribedGroupsForUser').callsFake((email, callback) => {
      callback(null, []);
    });

    groupsAndMembersService.removeMember('nick', err => {
      sinon.assert.notCalled(removeUserFromListSpy);
      sinon.assert.calledWith(removeMemberSpy, dummymember);
      done(err);
    });
  });

});

