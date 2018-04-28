'use strict';

const chado = require('chado');
const cb = chado.callback;
const verify = chado.verify;

const sinon = require('sinon').sandbox.create();
const expect = require('must-dist');

const conf = require('../../testutil/configureForTest');
const beans = conf.get('beans');
const Group = beans.get('group');

const groupsForTest = require('./groups_for_tests');
const GroupA = groupsForTest.GroupA;
const GroupB = groupsForTest.GroupB;
const NonPersistentGroup = groupsForTest.GroupC;

const groupstore = beans.get('groupstore');
const listAdapter = beans.get('fakeListAdapter');

const groupsService = beans.get('groupsService');

describe('Groups Service (getSubscribedGroupsForUser)', () => {

  afterEach(() => {
    sinon.restore();
  });

  it('returns an empty array of groups for a user who is not subscribed anywhere', done => {
    sinon.stub(groupstore, 'groupsByLists').callsFake((lists, globalCallback) => {
      globalCallback(null, []);
    });
    sinon.stub(listAdapter, 'getSubscribedListsForUser').callsFake((email, callback) => { callback(null, []); });

    groupsService.getSubscribedGroupsForUser('me@bla.com', (err, validLists) => {
      expect(validLists).to.not.be(null);
      expect(validLists.length).to.equal(0);
      done(err);
    });
  });

  it('returns one group for a user who is subscribed to one list', done => {
    sinon.stub(groupstore, 'groupsByLists').callsFake((lists, globalCallback) => {
      globalCallback(null, [GroupA]);
    });
    sinon.stub(listAdapter, 'getSubscribedListsForUser').callsFake((email, callback) => { callback(null, ['GroupA']); });

    groupsService.getSubscribedGroupsForUser('GroupAuser@softwerkskammer.de', (err, validLists) => {
      expect(validLists).to.not.be(null);
      expect(validLists.length).to.equal(1);
      expect(validLists[0]).to.equal(GroupA);
      done(err);
    });
  });

  it('returns two groups for a user who is subscribed to two lists', done => {
    sinon.stub(groupstore, 'groupsByLists').callsFake((lists, globalCallback) => {
      globalCallback(null, [GroupA, GroupB]);
    });
    sinon.stub(listAdapter, 'getSubscribedListsForUser').callsFake((email, callback) => {
      callback(null, ['GroupA', 'GroupB']);
    });

    groupsService.getSubscribedGroupsForUser('GroupAandBuser@softwerkskammer.de', (err, validLists) => {
      expect(validLists).to.not.be(null);
      expect(validLists.length).to.equal(2);
      expect(validLists[0]).to.equal(GroupA);
      expect(validLists[1]).to.equal(GroupB);
      done(err);
    });
  });

  it('never returns the admin group subscription', done => {
    const spy = sinon.stub(groupstore, 'groupsByLists').callsFake((lists, globalCallback) => {
      globalCallback(null, []);
    });
    sinon.stub(listAdapter, 'getSubscribedListsForUser').callsFake((email, callback) => {
      callback(null, ['GroupA', 'GroupB', conf.get('adminListName')]);
    });

    groupsService.getSubscribedGroupsForUser('admin@softwerkskammer.de', err => {
      expect(spy.calledWith(['GroupA', 'GroupB'])).to.be(true);
      done(err);
    });
  });

  it('handles errors in retrieving lists', done => {
    sinon.stub(listAdapter, 'getSubscribedListsForUser').callsFake((email, callback) => {
      callback(new Error(), null);
    });

    groupsService.getSubscribedGroupsForUser('admin@softwerkskammer.de', err => {
      expect(err).to.exist();
      done();
    });
  });
});

describe('Groups Service (getAllAvailableGroups)', () => {

  afterEach(() => {
    sinon.restore();
  });

  it('returns an empty array of groups if there are no lists defined in mailinglist', done => {
    sinon.stub(groupstore, 'groupsByLists').callsFake((lists, globalCallback) => {
      globalCallback(null, []);
    });
    sinon.stub(listAdapter, 'getAllAvailableLists').callsFake(callback => { callback(null, []); });

    groupsService.getAllAvailableGroups((err, lists) => {
      expect(lists).to.not.be(null);
      expect(lists.length).to.equal(0);
      done(err);
    });
  });

  it('returns an empty array of groups if there is one list defined in mailinglist but there is no matching group in Softwerkskammer', done => {
    sinon.stub(groupstore, 'groupsByLists').callsFake((lists, globalCallback) => {
      globalCallback(null, []);
    });
    sinon.stub(listAdapter, 'getAllAvailableLists').callsFake(callback => { callback(null, ['unknownGroup']); });

    groupsService.getAllAvailableGroups((err, lists) => {
      expect(lists).to.not.be(null);
      expect(lists.length).to.equal(0);
      done(err);
    });
  });

  it('returns one group if there are two lists defined in mailinglist and there is one matching group in Softwerkskammer', done => {
    sinon.stub(groupstore, 'groupsByLists').callsFake((lists, globalCallback) => {
      globalCallback(null, [GroupA]);
    });
    sinon.stub(listAdapter, 'getAllAvailableLists').callsFake(callback => { callback(null, ['GroupA', 'unknownGroup']); });

    groupsService.getAllAvailableGroups((err, lists) => {
      expect(lists).to.not.be(null);
      expect(lists.length).to.equal(1);
      expect(lists[0]).to.equal(GroupA);
      done(err);
    });
  });

  it('returns two groups if there are two lists defined in mailinglist and there are two matching groups in Softwerkskammer', done => {
    sinon.stub(groupstore, 'groupsByLists').callsFake((lists, globalCallback) => {
      globalCallback(null, [GroupA, GroupB]);
    });
    sinon.stub(listAdapter, 'getAllAvailableLists').callsFake(callback => { callback(null, ['GroupA', 'GroupB']); });

    groupsService.getAllAvailableGroups((err, lists) => {
      expect(lists).to.not.be(null);
      expect(lists.length).to.equal(2);
      expect(lists[0]).to.equal(GroupA);
      expect(lists[1]).to.equal(GroupB);
      done(err);
    });
  });
});

describe('Groups Service (getMailinglistUsersOfList)', () => {

  beforeEach(() => {
    chado.createDouble('groupsService', groupsService);
  });

  afterEach(() => {
    sinon.restore();
    chado.reset();
  });

  it('returns an empty array if there are no users subscribed to the list "groupa" in mailinglist', done => {
    sinon.stub(listAdapter, 'getUsersOfList').callsFake((groupname, callback) => { callback(null, []); });

    verify('groupsService').canHandle('getMailinglistUsersOfList')
      .withArgs('groupa', cb).andCallsCallbackWith(null, []).on(groupsService, done);
  });

  it('returns an array with the email address if there is one user subscribed to the list "groupa" in mailinglist', done => {
    sinon.stub(listAdapter, 'getUsersOfList').callsFake((groupname, callback) => { callback(null, ['email1']); });

    verify('groupsService').canHandle('getMailinglistUsersOfList')
      .withArgs('groupa', cb).andCallsCallbackWith(null, ['email1']).on(groupsService, done);
  });

  it('returns an empty array of lists if there are no users subscribed to the list "groupb" in mailinglist', done => {
    sinon.stub(listAdapter, 'getUsersOfList').callsFake((groupname, callback) => { callback(null, []); });

    verify('groupsService').canHandle('getMailinglistUsersOfList')
      .withArgs('groupb', cb).andCallsCallbackWith(null, []).on(groupsService, done);
  });

  it('returns an array with the email address if there is one user subscribed to the list "groupb" in mailinglist', done => {
    sinon.stub(listAdapter, 'getUsersOfList').callsFake((groupname, callback) => { callback(null, ['email1']); });

    verify('groupsService').canHandle('getMailinglistUsersOfList')
      .withArgs('groupb', cb).andCallsCallbackWith(null, ['email1']).on(groupsService, done);
  });

  it('returns multiple users subscribed to the list in mailinglist', done => {
    sinon.stub(listAdapter, 'getUsersOfList').callsFake(
      (groupname, callback) => { callback(null, ['email1', 'email2', 'email3']); }
    );

    verify('groupsService').canHandle('getMailinglistUsersOfList')
      .withArgs('groupa', cb).andCallsCallbackWith(null, ['email1', 'email2', 'email3']).on(groupsService, done);
  });
});

describe('Groups Service (createOrSaveGroup)', () => {

  let createListSpy;
  let saveGroupSpy;

  beforeEach(() => {
    createListSpy = sinon.stub(listAdapter, 'createList').callsFake((listname, prefix, callback) => { callback(); });
    saveGroupSpy = sinon.stub(groupstore, 'saveGroup').callsFake((group, callback) => { callback(null); });

    sinon.stub(groupstore, 'getGroup').callsFake((groupname, callback) => {
      if (groupname === 'groupa') {
        callback(null, GroupA);
      } else if (groupname === 'groupb') {
        callback(null, GroupB);
      } else {
        callback(null, null);
      }
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('creates a new group and saves it if there is no group with the given name', done => {

    groupsService.createOrSaveGroup(NonPersistentGroup, (err, group) => {
      expect(group).to.be(null); // would return an existingGroup, but Group is new
      expect(createListSpy.calledOnce).to.be(true);
      expect(saveGroupSpy.calledOnce).to.be(true);
      done(err);
    });
  });

  it('only saves the group if there already exists a group with the given name', done => {

    groupsService.createOrSaveGroup(GroupA, (err, group) => {
      expect(group).to.equal(GroupA);
      expect(createListSpy.called).to.be(false);
      expect(saveGroupSpy.calledOnce).to.be(true);
      done(err);
    });
  });
});

describe('Groups Service (groupFromObject)', () => {
  it('returns a new Group object if there is no valid group data', () => {
    const result = new Group({id: 'x'});

    expect(result).to.not.be(null);
    expect(result).to.be.instanceOf(Group);
    expect(result.id).to.equal('x');
    expect(result.longName).to.be(undefined);
    expect(result.description).to.be(undefined);
    expect(result.type).to.be(undefined);
  });

  it('returns a valid Group object if there is valid group data', () => {
    const result = new Group({
      id: 'craftsmanswap',
      longName: 'Craftsman Swaps',
      description: 'A group for organizing CS',
      type: 'Themengruppe'
    });

    expect(result).to.not.be(null);
    expect(result).to.be.instanceOf(Group);
    expect(result.id).to.equal('craftsmanswap');
    expect(result.longName).to.equal('Craftsman Swaps');
    expect(result.description).to.equal('A group for organizing CS');
    expect(result.type).to.equal('Themengruppe');
  });
});

describe('Groups Service (allGroupColors)', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('returns an object with group id and color', done => {
    GroupA.color = '#FFFFFF';
    GroupB.color = '#AAAAAA';
    sinon.stub(groupstore, 'groupsByLists').callsFake((lists, globalCallback) => {
      globalCallback(null, [GroupA, GroupB]);
    });
    sinon.stub(listAdapter, 'getAllAvailableLists').callsFake(callback => { callback(null, ['GroupA', 'GroupB']); });

    groupsService.allGroupColors((err, colorMap) => {
      expect(colorMap).to.have.ownProperty('groupa', '#FFFFFF');
      expect(colorMap).to.have.ownProperty('groupb', '#AAAAAA');
      delete GroupA.color;
      delete GroupB.color;
      done(err);
    });
  });

  it('handles an error gracefully', done => {
    sinon.stub(listAdapter, 'getAllAvailableLists').callsFake(callback => { callback(new Error()); });

    groupsService.allGroupColors(err => {
      expect(err).to.exist();
      done();
    });
  });
});

describe('Groups Service (isGroupNameAvailable)', () => {
  before(() => {
    sinon.stub(groupstore, 'getGroup').callsFake((groupname, callback) => {
      if (groupname === 'GroupA') {
        callback(null, GroupA);
      } else if (groupname === 'GroupB') {
        callback(null, GroupB);
      } else if (groupname === 'Err') {
        callback(new Error('Err'));
      } else {
        callback(null, null);
      }
    });
  });

  after(() => {
    sinon.restore();
  });

  it('handles Errors', done => {
    groupsService.isGroupNameAvailable('Err', err => {
      expect(err).to.exist();
      done();
    });
  });

  it('returns false when there is already a group of this name present', done => {
    groupsService.isGroupNameAvailable('GroupA', (err, result) => {
      expect(result).to.not.be(null);
      expect(result).to.be(false);
      done(err);
    });
  });

  it('returns true when there is no group of this name present', done => {
    groupsService.isGroupNameAvailable('MyGroup', (err, result) => {
      expect(result).to.not.be(null);
      expect(result).to.be(true);
      done(err);
    });
  });

  it('rejects groupnames that contain special characters', done => {
    expect(groupsService.isReserved('Sch adar')).to.be(true);
    expect(groupsService.isReserved('Sch/adar')).to.be(true);
    expect(groupsService.isReserved('Schad\nar')).to.be(true);
    expect(groupsService.isReserved('Schad@r')).to.be(true);

    groupsService.isGroupNameAvailable('Scha dar', (err, result) => {
      expect(result).to.be(false);
      done(err);
    });
  });

  it('allows groupnames that contain alphanumeric characters only', done => {
    expect(groupsService.isReserved('Schad_r')).to.be(false);
    expect(groupsService.isReserved('Schadar')).to.be(false);

    groupsService.isGroupNameAvailable('Schadar', (err, result) => {
      expect(result).to.be(true);
      done(err);
    });
  });

  it('rejects groupnames that contain reserved routes', done => {
    expect(groupsService.isReserved('new')).to.be(true);
    expect(groupsService.isReserved('submit')).to.be(true);
    expect(groupsService.isReserved('administration')).to.be(true);
    expect(groupsService.isReserved('edit')).to.be(true);
    expect(groupsService.isReserved('checkgroupname')).to.be(true);

    groupsService.isGroupNameAvailable('edit', (err, result) => {
      expect(result).to.be(false);
      done(err);
    });
  });
});

describe('Groups Service (isEmailPrefixAvailable)', () => {
  it('returns false for an undefined prefix', done => {
    groupsService.isEmailPrefixAvailable(undefined, (err, result) => {
      expect(result).to.be(false);
      done(err);
    });
  });

  it('returns false for a null prefix', done => {
    groupsService.isEmailPrefixAvailable(null, (err, result) => {
      expect(result).to.be(false);
      done(err);
    });
  });

  it('returns false for an empty prefix', done => {
    groupsService.isEmailPrefixAvailable('', (err, result) => {
      expect(result).to.be(false);
      done(err);
    });
  });
});
