/*global describe, it*/
"use strict";
var proxyquire = require('proxyquire');
var sinon = require('sinon');

var expect = require('chai').expect;

var Group = require('../../lib/groups/group');

var GroupA = new Group('GroupA', 'Gruppe A', 'Dies ist Gruppe A.', 'Themengruppe');
var GroupB = new Group('GroupB', 'Gruppe B', 'Dies ist Gruppe B.', 'Regionalgruppe');
var NonPersistentGroup = new Group('GroupC', 'Gruppe C', 'Dies ist Gruppe C.', 'Regionalgruppe');

var groupstoreStub = {
    allGroups: function (callback) { callback(null, [GroupA, GroupB]); },
    getGroup: function (name, callback) {
      if (name === 'GroupA') {
        callback(null, GroupA);
      } else if (name === 'GroupB') {
        callback(null, GroupB);
      } else {
        callback(null, null);
      }
    },
    saveGroup: function (group, callback) { callback(null, group); },
    groupsByLists: function () {}
  }
  ;

var sympaStub = {
  createList: function (err, callback) { callback(); },
  getSubscribedListsForUser: function () {},
  getAllAvailableLists: function () {},
  getUsersOfList: function () {}
};

var groupsAPI = proxyquire('../../lib/groups/groupsAPI', {
  './groupstore': function () { return groupstoreStub; },
  './sympaStub': function () { return sympaStub; }
});

var systemUnderTest = groupsAPI({ get: function () { return null; } });   // empty config -> sympaStub is required

describe('Groups API (getSubscribedGroupsForUser)', function () {

  it('returns an empty array of groups for a user who is not subscribed anywhere', function (done) {
    groupstoreStub.groupsByLists = function (lists, globalCallback) {
      globalCallback(null, []);
    };
    sympaStub.getSubscribedListsForUser = function (email, callback) { callback(null, []); };

    systemUnderTest.getSubscribedGroupsForUser('me@bla.com', function (err, validLists) {
      expect(validLists).to.not.be.null;
      expect(validLists.length).to.equal(0);
      done(err);
    });
  });

  it('returns one group for a user who is subscribed to one list', function (done) {
    groupstoreStub.groupsByLists = function (lists, globalCallback) {
      globalCallback(null, [GroupA]);
    };
    sympaStub.getSubscribedListsForUser = function (email, callback) { callback(null, ['GroupA']); };

    systemUnderTest.getSubscribedGroupsForUser('GroupAuser@softwerkskammer.de', function (err, validLists) {
      expect(validLists).to.not.be.null;
      expect(validLists.length).to.equal(1);
      expect(validLists[0]).to.equal(GroupA);
      done(err);
    });
  });

  it('returns two groups for a user who is subscribed to two lists', function (done) {
    groupstoreStub.groupsByLists = function (lists, globalCallback) {
      globalCallback(null, [GroupA, GroupB]);
    };
    sympaStub.getSubscribedListsForUser = function (email, callback) {
      callback(null, ['GroupA', 'GroupB']);
    };

    systemUnderTest.getSubscribedGroupsForUser('GroupAandBuser@softwerkskammer.de', function (err, validLists) {
      expect(validLists).to.not.be.null;
      expect(validLists.length).to.equal(2);
      expect(validLists[0]).to.equal(GroupA);
      expect(validLists[1]).to.equal(GroupB);
      done(err);
    });
  });
});

describe('Groups API (getAllAvailableGroups)', function () {

  it('returns an empty array of groups if there are no lists defined in sympa', function (done) {
    groupstoreStub.groupsByLists = function (lists, globalCallback) {
      globalCallback(null, []);
    };
    sympaStub.getAllAvailableLists = function (callback) { callback(null, []); };

    systemUnderTest.getAllAvailableGroups(function (err, lists) {
      expect(lists).to.not.be.null;
      expect(lists.length).to.equal(0);
      done(err);
    });
  });

  it('returns an empty array of groups if there is one list defined in sympa but there is no matching group in Softwerkskammer', function (done) {
    groupstoreStub.groupsByLists = function (lists, globalCallback) {
      globalCallback(null, []);
    };
    sympaStub.getAllAvailableLists = function (callback) { callback(null, ['unknownGroup']); };

    systemUnderTest.getAllAvailableGroups(function (err, lists) {
      expect(lists).to.not.be.null;
      expect(lists.length).to.equal(0);
      done(err);
    });
  });

  it('returns one group if there are two lists defined in sympa and there is one matching group in Softwerkskammer', function (done) {
    groupstoreStub.groupsByLists = function (lists, globalCallback) {
      globalCallback(null, [GroupA]);
    };
    sympaStub.getAllAvailableLists = function (callback) { callback(null, ['GroupA', 'unknownGroup']); };

    systemUnderTest.getAllAvailableGroups(function (err, lists) {
      expect(lists).to.not.be.null;
      expect(lists.length).to.equal(1);
      expect(lists[0]).to.equal(GroupA);
      done(err);
    });
  });

  it('returns two groups if there are two lists defined in sympa and there are two matching groups in Softwerkskammer', function (done) {
    groupstoreStub.groupsByLists = function (lists, globalCallback) {
      globalCallback(null, [GroupA, GroupB]);
    };
    sympaStub.getAllAvailableLists = function (callback) { callback(null, ['GroupA', 'GroupB']); };

    systemUnderTest.getAllAvailableGroups(function (err, lists) {
      expect(lists).to.not.be.null;
      expect(lists.length).to.equal(2);
      expect(lists[0]).to.equal(GroupA);
      expect(lists[1]).to.equal(GroupB);
      done(err);
    });
  });
});

describe('Groups API (getSympaUsersOfList)', function () {

  it('returns an empty array of lists if there are no users subscribed to the list in sympa', function (done) {
    sympaStub.getUsersOfList = function (groupname, callback) { callback(null, []); };

    systemUnderTest.getSympaUsersOfList('groupname', function (err, lists) {
      expect(lists).to.not.be.null;
      expect(lists.length).to.equal(0);
      done(err);
    });
  });

  it('returns the users subscribed to the list in sympa', function (done) {
    sympaStub.getUsersOfList = function (groupname, callback) { callback(null, ['user1@mail1.de', 'user2@mail2.de', 'user3@mail3.de']); };

    systemUnderTest.getSympaUsersOfList('groupname', function (err, users) {
      expect(users).to.not.be.null;
      expect(users.length).to.equal(3);
      expect(users[0]).to.equal('user1@mail1.de');
      expect(users[1]).to.equal('user2@mail2.de');
      expect(users[2]).to.equal('user3@mail3.de');
      done(err);
    });
  });
});

describe('Groups API (getGroup)', function () {
  it('returns null if there is no group with the given name', function (done) {

    systemUnderTest.getGroup('groupname', function (err, group) {
      expect(group).to.be.null;
      done(err);
    });
  });

  it('returns the group if there is a group with the given name', function (done) {

    systemUnderTest.getGroup('GroupA', function (err, group) {
      expect(group).to.equal(GroupA);
      done(err);
    });
  });
});

describe('Groups API (createOrSaveGroup)', function () {

  var createListSpy;
  var saveGroupSpy;

  beforeEach(function (done) {
    createListSpy = sinon.spy(sympaStub, 'createList');
    saveGroupSpy = sinon.spy(groupstoreStub, 'saveGroup');
    done();
  });

  afterEach(function (done) {
    sympaStub.createList.restore();
    groupstoreStub.saveGroup.restore();
    done();
  });

  it('creates a new group and saves it if there is no group with the given name', function (done) {

    systemUnderTest.createOrSaveGroup(NonPersistentGroup, function (err, group) {
      expect(group).to.equal(NonPersistentGroup);
      expect(createListSpy.calledOnce).to.be.true;
      expect(saveGroupSpy.calledOnce).to.be.true;
      done(err);
    });
  });

  it('only saves the group if there already exists a group with the given name', function (done) {

    systemUnderTest.createOrSaveGroup(GroupA, function (err, group) {
      expect(group).to.equal(GroupA);
      expect(createListSpy.called).to.be.false;
      expect(saveGroupSpy.calledOnce).to.be.true;
      done(err);
    });
  });
});

describe('Groups API (groupFromObject)', function () {
  it('returns a new Group object if there is no valid group data', function (done) {
    var result = systemUnderTest.groupFromObject({});

    expect(result).to.be.not.null;
    expect(result).to.be.instanceOf(Group);
    expect(result.id).to.be.undefined;
    expect(result.longName).to.be.undefined;
    expect(result.description).to.be.undefined;
    expect(result.type).to.be.undefined;
    done();
  });

  it('returns a valid Group object if there is valid group data', function (done) {
    var result = systemUnderTest.groupFromObject({ id: 'craftsmanswap', longName: 'Craftsman Swaps',
      description: 'A group for organizing CS',
      type: 'Themengruppe' });

    expect(result).to.be.not.null;
    expect(result).to.be.instanceOf(Group);
    expect(result.id).to.equal('craftsmanswap');
    expect(result.longName).to.equal('Craftsman Swaps');
    expect(result.description).to.equal('A group for organizing CS');
    expect(result.type).to.equal('Themengruppe');
    done();
  });
});

describe('Groups API (isGroupNameAvailable)', function () {
  it('returns false when there is already a group of this name present', function (done) {
    systemUnderTest.isGroupNameAvailable("GroupA", function (err, result) {
      expect(result).to.be.not.null;
      expect(result).to.be.false;
      done(err);
    });
  });

  it('returns true when there is no group of this name present', function (done) {
    systemUnderTest.isGroupNameAvailable("MyGroup", function (err, result) {
      expect(result).to.be.not.null;
      expect(result).to.be.true;
      done(err);
    });
  });

  it('rejects groupnames that contain special characters', function (done) {
    expect(systemUnderTest.isReserved('Sch adar')).to.be.true;
    expect(systemUnderTest.isReserved('Sch/adar')).to.be.true;
    expect(systemUnderTest.isReserved('Schadar-')).to.be.true;
    expect(systemUnderTest.isReserved('Schad\nar')).to.be.true;
    expect(systemUnderTest.isReserved('Schad@r')).to.be.true;

    systemUnderTest.isGroupNameAvailable('Scha dar', function (err, result) {
      expect(result).to.be.false;
      done();
    });
  });

  it('allows groupnames that contain alphanumeric characters only', function (done) {

    expect(systemUnderTest.isReserved('Schad_r')).to.be.false;
    expect(systemUnderTest.isReserved('Schadar')).to.be.false;

    systemUnderTest.isGroupNameAvailable('Schadar', function (err, result) {
      expect(result).to.be.true;
      done();
    });
  });

  it('rejects groupnames that contain reserved routes', function (done) {

    expect(systemUnderTest.isReserved('new')).to.be.true;
    expect(systemUnderTest.isReserved('submit')).to.be.true;
    expect(systemUnderTest.isReserved('administration')).to.be.true;
    expect(systemUnderTest.isReserved('edit')).to.be.true;
    expect(systemUnderTest.isReserved('checkgroupname')).to.be.true;

    systemUnderTest.isGroupNameAvailable('edit', function (err, result) {
      expect(result).to.be.false;
      done();
    });
  });

  describe('Groups API (updateGroupsFieldWith)', function () {
    var oldDescription;
    var oldLongName;
    var oldType;

    beforeEach(function (done) {
      oldDescription = GroupA.description;
      oldLongName = GroupA.longName;
      oldType = GroupA.type;
      done();
    });

    afterEach(function (done) {
      GroupA.description = oldDescription;
      GroupA.longName = oldLongName;
      GroupA.type = oldType;
      done();
    });

    it('should update the description correctly', function (done) {
      expect(GroupA.description).to.not.equal('new Description');
      systemUnderTest.updateGroupsFieldWith('GroupA', 'description', 'new Description', function (success) {
        expect(success).to.be.true;
        expect(GroupA.description).to.equal('new Description');
        done();
      });
    });

    it('should update the longName correctly', function (done) {
      expect(GroupA.longName).to.not.equal('new Long Name');
      systemUnderTest.updateGroupsFieldWith('GroupA', 'longName', 'new Long Name', function (success) {
        expect(success).to.be.true;
        expect(GroupA.longName).to.equal('new Long Name');
        done();
      });
    });

    it('should update the type correctly', function (done) {
      expect(GroupA.type).to.equal('Themengruppe');
      systemUnderTest.updateGroupsFieldWith('GroupA', 'type', '1', function (success) {
        expect(success).to.be.true;
        expect(GroupA.type).to.equal('Regionalgruppe');
        done();
      });
    });

  });

});
