'use strict';

var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');

var conf = require('../../testutil/configureForTest');
var beans = conf.get('beans');
var Group = beans.get('group');

var GroupA = new Group({
  id: 'GroupA',
  longName: 'Gruppe A',
  description: 'Dies ist Gruppe A.',
  type: 'Themengruppe',
  emailPrefix: 'PREFIX',
  color: '#FFFFFF'
});
var GroupB = new Group({
  id: 'GroupB',
  longName: 'Gruppe B',
  description: 'Dies ist Gruppe B.',
  type: 'Regionalgruppe',
  color: '#AAAAAA'
});
var NonPersistentGroup = new Group({
  id: 'Group C',
  longName: 'Gruppe C',
  description: 'Dies ist Gruppe C.',
  type: 'Regionalgruppe'
});

var groupstore = beans.get('groupstore');
var listAdapter = beans.get('fakeListAdapter');

var systemUnderTest = beans.get('groupsService');

describe('Groups Service (getSubscribedGroupsForUser)', function () {

  afterEach(function () {
    sinon.restore();
  });

  it('returns an empty array of groups for a user who is not subscribed anywhere', function (done) {
    sinon.stub(groupstore, 'groupsByLists', function (lists, globalCallback) {
      globalCallback(null, []);
    });
    sinon.stub(listAdapter, 'getSubscribedListsForUser', function (email, callback) { callback(null, []); });

    systemUnderTest.getSubscribedGroupsForUser('me@bla.com', function (err, validLists) {
      expect(validLists).to.not.be(null);
      expect(validLists.length).to.equal(0);
      done(err);
    });
  });

  it('returns one group for a user who is subscribed to one list', function (done) {
    sinon.stub(groupstore, 'groupsByLists', function (lists, globalCallback) {
      globalCallback(null, [GroupA]);
    });
    sinon.stub(listAdapter, 'getSubscribedListsForUser', function (email, callback) { callback(null, ['GroupA']); });

    systemUnderTest.getSubscribedGroupsForUser('GroupAuser@softwerkskammer.de', function (err, validLists) {
      expect(validLists).to.not.be(null);
      expect(validLists.length).to.equal(1);
      expect(validLists[0]).to.equal(GroupA);
      done(err);
    });
  });

  it('returns two groups for a user who is subscribed to two lists', function (done) {
    sinon.stub(groupstore, 'groupsByLists', function (lists, globalCallback) {
      globalCallback(null, [GroupA, GroupB]);
    });
    sinon.stub(listAdapter, 'getSubscribedListsForUser', function (email, callback) {
      callback(null, ['GroupA', 'GroupB']);
    });

    systemUnderTest.getSubscribedGroupsForUser('GroupAandBuser@softwerkskammer.de', function (err, validLists) {
      expect(validLists).to.not.be(null);
      expect(validLists.length).to.equal(2);
      expect(validLists[0]).to.equal(GroupA);
      expect(validLists[1]).to.equal(GroupB);
      done(err);
    });
  });

  it('never returns the admin group subscription', function (done) {
    var spy = sinon.stub(groupstore, 'groupsByLists', function (lists, globalCallback) {
      globalCallback(null, []);
    });
    sinon.stub(listAdapter, 'getSubscribedListsForUser', function (email, callback) {
      callback(null, ['GroupA', 'GroupB', conf.get('adminListName')]);
    });

    systemUnderTest.getSubscribedGroupsForUser('admin@softwerkskammer.de', function (err) {
      expect(spy.calledWith(['GroupA', 'GroupB'])).to.be(true);
      done(err);
    });
  });

  it('handles errors in retrieving lists', function (done) {
    sinon.stub(listAdapter, 'getSubscribedListsForUser', function (email, callback) {
      callback(new Error(), null);
    });

    systemUnderTest.getSubscribedGroupsForUser('admin@softwerkskammer.de', function (err) {
      expect(err).to.exist();
      done();
    });
  });
});

describe('Groups Service (getAllAvailableGroups)', function () {

  afterEach(function () {
    sinon.restore();
  });

  it('returns an empty array of groups if there are no lists defined in mailinglist', function (done) {
    sinon.stub(groupstore, 'groupsByLists', function (lists, globalCallback) {
      globalCallback(null, []);
    });
    sinon.stub(listAdapter, 'getAllAvailableLists', function (callback) { callback(null, []); });

    systemUnderTest.getAllAvailableGroups(function (err, lists) {
      expect(lists).to.not.be(null);
      expect(lists.length).to.equal(0);
      done(err);
    });
  });

  it('returns an empty array of groups if there is one list defined in mailinglist but there is no matching group in Softwerkskammer', function (done) {
    sinon.stub(groupstore, 'groupsByLists', function (lists, globalCallback) {
      globalCallback(null, []);
    });
    sinon.stub(listAdapter, 'getAllAvailableLists', function (callback) { callback(null, ['unknownGroup']); });

    systemUnderTest.getAllAvailableGroups(function (err, lists) {
      expect(lists).to.not.be(null);
      expect(lists.length).to.equal(0);
      done(err);
    });
  });

  it('returns one group if there are two lists defined in mailinglist and there is one matching group in Softwerkskammer', function (done) {
    sinon.stub(groupstore, 'groupsByLists', function (lists, globalCallback) {
      globalCallback(null, [GroupA]);
    });
    sinon.stub(listAdapter, 'getAllAvailableLists', function (callback) { callback(null, ['GroupA', 'unknownGroup']); });

    systemUnderTest.getAllAvailableGroups(function (err, lists) {
      expect(lists).to.not.be(null);
      expect(lists.length).to.equal(1);
      expect(lists[0]).to.equal(GroupA);
      done(err);
    });
  });

  it('returns two groups if there are two lists defined in mailinglist and there are two matching groups in Softwerkskammer', function (done) {
    sinon.stub(groupstore, 'groupsByLists', function (lists, globalCallback) {
      globalCallback(null, [GroupA, GroupB]);
    });
    sinon.stub(listAdapter, 'getAllAvailableLists', function (callback) { callback(null, ['GroupA', 'GroupB']); });

    systemUnderTest.getAllAvailableGroups(function (err, lists) {
      expect(lists).to.not.be(null);
      expect(lists.length).to.equal(2);
      expect(lists[0]).to.equal(GroupA);
      expect(lists[1]).to.equal(GroupB);
      done(err);
    });
  });
});

describe('Groups Service (getMailinglistUsersOfList)', function () {

  afterEach(function () {
    sinon.restore();
  });

  it('returns an empty array of lists if there are no users subscribed to the list in mailinglist', function (done) {
    sinon.stub(listAdapter, 'getUsersOfList', function (groupname, callback) { callback(null, []); });

    systemUnderTest.getMailinglistUsersOfList('groupname', function (err, lists) {
      expect(lists).to.not.be(null);
      expect(lists.length).to.equal(0);
      done(err);
    });
  });

  it('returns the users subscribed to the list in mailinglist', function (done) {
    sinon.stub(listAdapter, 'getUsersOfList', function (groupname, callback) {
      callback(null, ['user1@mail1.de', 'user2@mail2.de', 'user3@mail3.de']);
    });

    systemUnderTest.getMailinglistUsersOfList('groupname', function (err, users) {
      expect(users).to.not.be(null);
      expect(users.length).to.equal(3);
      expect(users[0]).to.equal('user1@mail1.de');
      expect(users[1]).to.equal('user2@mail2.de');
      expect(users[2]).to.equal('user3@mail3.de');
      done(err);
    });
  });
});

describe('Groups Service (createOrSaveGroup)', function () {

  var createListSpy;
  var saveGroupSpy;

  beforeEach(function () {
    createListSpy = sinon.stub(listAdapter, 'createList', function (listname, prefix, callback) { callback(); });
    saveGroupSpy = sinon.stub(groupstore, 'saveGroup', function (group, callback) { callback(null); });

    sinon.stub(groupstore, 'getGroup', function (name, callback) {
      if (name === 'groupa') {
        callback(null, GroupA);
      } else if (name === 'groupb') {
        callback(null, GroupB);
      } else {
        callback(null, null);
      }
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('creates a new group and saves it if there is no group with the given name', function (done) {

    systemUnderTest.createOrSaveGroup(NonPersistentGroup, function (err, group) {
      expect(group).to.be(null); // would return an existingGroup, but Group is new
      expect(createListSpy.calledOnce).to.be(true);
      expect(saveGroupSpy.calledOnce).to.be(true);
      done(err);
    });
  });

  it('only saves the group if there already exists a group with the given name', function (done) {

    systemUnderTest.createOrSaveGroup(GroupA, function (err, group) {
      expect(group).to.equal(GroupA);
      expect(createListSpy.called).to.be(false);
      expect(saveGroupSpy.calledOnce).to.be(true);
      done(err);
    });
  });
});

describe('Groups Service (groupFromObject)', function () {
  it('returns a new Group object if there is no valid group data', function () {
    var result = new Group({id: 'x'});

    expect(result).to.not.be(null);
    expect(result).to.be.instanceOf(Group);
    expect(result.id).to.equal('x');
    expect(result.longName).to.be(undefined);
    expect(result.description).to.be(undefined);
    expect(result.type).to.be(undefined);
  });

  it('returns a valid Group object if there is valid group data', function () {
    var result = new Group({
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

describe('Groups Service (allGroupColors)', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('returns an object with group id and color', function (done) {
    sinon.stub(groupstore, 'groupsByLists', function (lists, globalCallback) {
      globalCallback(null, [GroupA, GroupB]);
    });
    sinon.stub(listAdapter, 'getAllAvailableLists', function (callback) { callback(null, ['GroupA', 'GroupB']); });

    systemUnderTest.allGroupColors(function (err, colorMap) {
      expect(colorMap).to.have.ownProperty('groupa', '#FFFFFF');
      expect(colorMap).to.have.ownProperty('groupb', '#AAAAAA');
      done(err);
    });
  });

  it('handles an error gracefully', function (done) {
    sinon.stub(listAdapter, 'getAllAvailableLists', function (callback) { callback(new Error()); });

    systemUnderTest.allGroupColors(function (err) {
      expect(err).to.exist();
      done();
    });
  });
});

describe('Groups Service (isGroupNameAvailable)', function () {
  before(function () {
    sinon.stub(groupstore, 'getGroup', function (name, callback) {
      if (name === 'GroupA') {
        callback(null, GroupA);
      } else if (name === 'GroupB') {
        callback(null, GroupB);
      } else {
        callback(null, null);
      }
    });
  });

  after(function () {
    sinon.restore();
  });

  it('returns false when there is already a group of this name present', function (done) {
    systemUnderTest.isGroupNameAvailable('GroupA', function (err, result) {
      expect(result).to.not.be(null);
      expect(result).to.be(false);
      done(err);
    });
  });

  it('returns true when there is no group of this name present', function (done) {
    systemUnderTest.isGroupNameAvailable('MyGroup', function (err, result) {
      expect(result).to.not.be(null);
      expect(result).to.be(true);
      done(err);
    });
  });

  it('rejects groupnames that contain special characters', function (done) {
    expect(systemUnderTest.isReserved('Sch adar')).to.be(true);
    expect(systemUnderTest.isReserved('Sch/adar')).to.be(true);
    expect(systemUnderTest.isReserved('Schad\nar')).to.be(true);
    expect(systemUnderTest.isReserved('Schad@r')).to.be(true);

    systemUnderTest.isGroupNameAvailable('Scha dar', function (err, result) {
      expect(result).to.be(false);
      done(err);
    });
  });

  it('allows groupnames that contain alphanumeric characters only', function (done) {

    expect(systemUnderTest.isReserved('Schad_r')).to.be(false);
    expect(systemUnderTest.isReserved('Schadar')).to.be(false);

    systemUnderTest.isGroupNameAvailable('Schadar', function (err, result) {
      expect(result).to.be(true);
      done(err);
    });
  });
  it('rejects groupnames that contain reserved routes', function (done) {

    expect(systemUnderTest.isReserved('new')).to.be(true);
    expect(systemUnderTest.isReserved('submit')).to.be(true);
    expect(systemUnderTest.isReserved('administration')).to.be(true);
    expect(systemUnderTest.isReserved('edit')).to.be(true);
    expect(systemUnderTest.isReserved('checkgroupname')).to.be(true);

    systemUnderTest.isGroupNameAvailable('edit', function (err, result) {
      expect(result).to.be(false);
      done(err);
    });
  });
});


