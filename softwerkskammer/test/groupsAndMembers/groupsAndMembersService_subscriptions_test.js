'use strict';

const sinon = require('sinon').createSandbox();
const beans = require('../../testutil/configureForTest').get('beans');

const expect = require('must-dist');

const Member = beans.get('member');
const Group = beans.get('group');
const groupsService = beans.get('groupsService');
const groupsAndMembersService = beans.get('groupsAndMembersService');

const email = 'user@mail.com';
const groupA = new Group({id: 'groupA', organizers: []});
const member = new Member({id: 'id', email});

describe('Groups and Members Service (Subscriptions)', () => {
  let addUserToListSpy;
  let removeUserFromListSpy;

  beforeEach(() => {
    addUserToListSpy = sinon.stub(groupsService, 'addMemberToGroupNamed').callsFake((mem, groupname, callback) => { callback(); });
    removeUserFromListSpy = sinon.stub(groupsService, 'removeMemberFromGroupNamed').callsFake((mem, groupname, callback) => { callback(); });
  });

  afterEach(() => {
    sinon.restore();
    groupA.organizers = [];
  });

  describe('saveGroup', () => {
    let createOrSaveGroupSpy;

    beforeEach(() => {
      createOrSaveGroupSpy = sinon.stub(groupsService, 'createOrSaveGroup').callsFake((group, callback) => { callback(); });
    });

    it('calls groupService to perform saving', done => {
      groupsAndMembersService.saveGroup(groupA, err => {
        expect(createOrSaveGroupSpy.called, 'save in GroupsService is called').to.be(true);
        done(err);
      });
    });
  });


  describe('(un)subscribe one group', () => {
    it('calls groupService to perform saving and subscribes only to groupA', done => {
      groupsAndMembersService.subscribeMemberToGroup(member, 'groupA', err => {
        expect(addUserToListSpy.calledOnce, 'subscribe in GroupsService is called').to.be(true);
        expect(addUserToListSpy.args[0][1]).to.equal('groupA');
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

  });

});

