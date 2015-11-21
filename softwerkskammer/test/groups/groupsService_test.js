'use strict';

var chado = require('chado');
var cb = chado.callback;
var verify = chado.verify;

var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');

var conf = require('../../testutil/configureForTest');
var beans = conf.get('beans');
var Group = beans.get('group');

var groupsForTest = require('./groups_for_tests');
var GroupA = groupsForTest.GroupA;
var GroupB = groupsForTest.GroupB;
var NonPersistentGroup = groupsForTest.GroupC;

var groupstore = beans.get('groupstore');
var listAdapter = beans.get('fakeListAdapter');

var groupsService = beans.get('groupsService');

describe('Groups Service (getSubscribedGroupsForUser)', function () {

  afterEach(function () {
    sinon.restore();
  });

  it('returns an empty array of groups for a user who is not subscribed anywhere', function (done) {
    sinon.stub(groupstore, 'groupsByLists', function (lists, globalCallback) {
      globalCallback(null, []);
    });
    sinon.stub(listAdapter, 'getSubscribedListsForUser', function (email, callback) { callback(null, []); });

    groupsService.getSubscribedGroupsForUser('me@bla.com', function (err, validLists) {
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

    groupsService.getSubscribedGroupsForUser('GroupAuser@softwerkskammer.de', function (err, validLists) {
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

    groupsService.getSubscribedGroupsForUser('GroupAandBuser@softwerkskammer.de', function (err, validLists) {
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

    groupsService.getSubscribedGroupsForUser('admin@softwerkskammer.de', function (err) {
      expect(spy.calledWith(['GroupA', 'GroupB'])).to.be(true);
      done(err);
    });
  });

  it('handles errors in retrieving lists', function (done) {
    sinon.stub(listAdapter, 'getSubscribedListsForUser', function (email, callback) {
      callback(new Error(), null);
    });

    groupsService.getSubscribedGroupsForUser('admin@softwerkskammer.de', function (err) {
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

    groupsService.getAllAvailableGroups(function (err, lists) {
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

    groupsService.getAllAvailableGroups(function (err, lists) {
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

    groupsService.getAllAvailableGroups(function (err, lists) {
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

    groupsService.getAllAvailableGroups(function (err, lists) {
      expect(lists).to.not.be(null);
      expect(lists.length).to.equal(2);
      expect(lists[0]).to.equal(GroupA);
      expect(lists[1]).to.equal(GroupB);
      done(err);
    });
  });
});

describe('Groups Service (getMailinglistUsersOfList)', function () {

  beforeEach(function () {
    chado.createDouble('groupsService', groupsService);
  });

  afterEach(function () {
    sinon.restore();
    chado.reset();
  });

  it('returns an empty array if there are no users subscribed to the list "groupa" in mailinglist', function (done) {
    sinon.stub(listAdapter, 'getUsersOfList', function (groupname, callback) { callback(null, []); });

    verify('groupsService').canHandle('getMailinglistUsersOfList')
      .withArgs('groupa', cb).andCallsCallbackWith(null, []).on(groupsService, done);
  });

  it('returns an array with the email address if there is one user subscribed to the list "groupa" in mailinglist', function (done) {
    sinon.stub(listAdapter, 'getUsersOfList', function (groupname, callback) { callback(null, ['email1']); });

    verify('groupsService').canHandle('getMailinglistUsersOfList')
      .withArgs('groupa', cb).andCallsCallbackWith(null, ['email1']).on(groupsService, done);
  });

  it('returns an empty array of lists if there are no users subscribed to the list "groupb" in mailinglist', function (done) {
    sinon.stub(listAdapter, 'getUsersOfList', function (groupname, callback) { callback(null, []); });

    verify('groupsService').canHandle('getMailinglistUsersOfList')
      .withArgs('groupb', cb).andCallsCallbackWith(null, []).on(groupsService, done);
  });

  it('returns an array with the email address if there is one user subscribed to the list "groupb" in mailinglist', function (done) {
    sinon.stub(listAdapter, 'getUsersOfList', function (groupname, callback) { callback(null, ['email1']); });

    verify('groupsService').canHandle('getMailinglistUsersOfList')
      .withArgs('groupb', cb).andCallsCallbackWith(null, ['email1']).on(groupsService, done);
  });

  it('returns multiple users subscribed to the list in mailinglist', function (done) {
    sinon.stub(listAdapter, 'getUsersOfList', function (groupname, callback) { callback(null, ['email1', 'email2', 'email3']); });

    verify('groupsService').canHandle('getMailinglistUsersOfList')
      .withArgs('groupa', cb).andCallsCallbackWith(null, ['email1', 'email2', 'email3']).on(groupsService, done);
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

    groupsService.createOrSaveGroup(NonPersistentGroup, function (err, group) {
      expect(group).to.be(null); // would return an existingGroup, but Group is new
      expect(createListSpy.calledOnce).to.be(true);
      expect(saveGroupSpy.calledOnce).to.be(true);
      done(err);
    });
  });

  it('only saves the group if there already exists a group with the given name', function (done) {

    groupsService.createOrSaveGroup(GroupA, function (err, group) {
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
    GroupA.color = '#FFFFFF';
    GroupB.color = '#AAAAAA';
    sinon.stub(groupstore, 'groupsByLists', function (lists, globalCallback) {
      globalCallback(null, [GroupA, GroupB]);
    });
    sinon.stub(listAdapter, 'getAllAvailableLists', function (callback) { callback(null, ['GroupA', 'GroupB']); });

    groupsService.allGroupColors(function (err, colorMap) {
      expect(colorMap).to.have.ownProperty('groupa', '#FFFFFF');
      expect(colorMap).to.have.ownProperty('groupb', '#AAAAAA');
      delete GroupA.color;
      delete GroupB.color;
      done(err);
    });
  });

  it('handles an error gracefully', function (done) {
    sinon.stub(listAdapter, 'getAllAvailableLists', function (callback) { callback(new Error()); });

    groupsService.allGroupColors(function (err) {
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
    groupsService.isGroupNameAvailable('GroupA', function (err, result) {
      expect(result).to.not.be(null);
      expect(result).to.be(false);
      done(err);
    });
  });

  it('returns true when there is no group of this name present', function (done) {
    groupsService.isGroupNameAvailable('MyGroup', function (err, result) {
      expect(result).to.not.be(null);
      expect(result).to.be(true);
      done(err);
    });
  });

  it('rejects groupnames that contain special characters', function (done) {
    expect(groupsService.isReserved('Sch adar')).to.be(true);
    expect(groupsService.isReserved('Sch/adar')).to.be(true);
    expect(groupsService.isReserved('Schad\nar')).to.be(true);
    expect(groupsService.isReserved('Schad@r')).to.be(true);

    groupsService.isGroupNameAvailable('Scha dar', function (err, result) {
      expect(result).to.be(false);
      done(err);
    });
  });

  it('allows groupnames that contain alphanumeric characters only', function (done) {

    expect(groupsService.isReserved('Schad_r')).to.be(false);
    expect(groupsService.isReserved('Schadar')).to.be(false);

    groupsService.isGroupNameAvailable('Schadar', function (err, result) {
      expect(result).to.be(true);
      done(err);
    });
  });
  it('rejects groupnames that contain reserved routes', function (done) {

    expect(groupsService.isReserved('new')).to.be(true);
    expect(groupsService.isReserved('submit')).to.be(true);
    expect(groupsService.isReserved('administration')).to.be(true);
    expect(groupsService.isReserved('edit')).to.be(true);
    expect(groupsService.isReserved('checkgroupname')).to.be(true);

    groupsService.isGroupNameAvailable('edit', function (err, result) {
      expect(result).to.be(false);
      done(err);
    });
  });
});


