/*global describe, it */
"use strict";
var proxyquire = require('proxyquire'),
  sinon = require('sinon');

var expect = require('chai').expect;

var Group = require('../lib/groups/group');

var GroupA = new Group('GroupA', 'Gruppe A', 'Dies ist Gruppe A.', 'Themengruppe');
var GroupB = new Group('GroupB', 'Gruppe B', 'Dies ist Gruppe B.', 'Regionalgruppe');
var NonPersistentGroup = new Group('GroupC', 'Gruppe C', 'Dies ist Gruppe C.', 'Regionalgruppe');

var groupstoreStub = {
  allGroups: function (callback) {
    callback(null, [GroupA, GroupB]);
  },
  getGroup: function (name, callback) {
    if (name === 'GroupA') {
      callback(null, GroupA);
    } else if (name === 'GroupB') {
      callback(null, GroupB);
    } else {
      callback(null, null);
    }
  },
  saveGroup: function (group, callback) {
    callback(null, group);
  }
};

var sympaStub = {
  createList: function (err, callback) {
    callback();
  },
  getSubscribedListsForUser: function () {
  },
  getAllAvailableLists: function () {
  },
  getUsersOfList: function () {
  }
};


var groupsAPI = proxyquire('../lib/groups/groupsAPI', {
  './groupstore': function () {
    return groupstoreStub;
  },
  './sympaStub': function () {
    return sympaStub;
  }
});

var systemUnderTest = groupsAPI({ get: function () {
  return null;
} });   // empty config -> sympaStub is required

describe('Groups API', function () {

  it('returns an empty array of groups for a user who is not subscribed anywhere', function (done) {
    sympaStub.getSubscribedListsForUser = function (email, callback) {
      callback(null, []);
    };

    systemUnderTest.getSubscribedGroupsForUser('me@bla.com', function (err, validLists) {
      expect(validLists).to.not.be.null;
      expect(validLists.length).to.equal(0);
      done(err);
    });
  });

  it('returns one group for a user who is subscribed to one list', function (done) {
    sympaStub.getSubscribedListsForUser = function (email, callback) {
      callback(null, ['GroupA']);
    };

    systemUnderTest.getSubscribedGroupsForUser('GroupAuser@softwerkskammer.de', function (err, validLists) {
      expect(validLists).to.not.be.null;
      expect(validLists.length).to.equal(1);
      expect(validLists[0]).to.equal(GroupA);
      done(err);
    });
  });

  it('returns two groups for a user who is subscribed to two lists', function (done) {
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

  it('returns an empty array of groups if there are no lists defined in sympa', function (done) {
    sympaStub.getAllAvailableLists = function (callback) {
      callback(null, []);
    };

    systemUnderTest.getAllAvailableGroups(function (err, lists) {
      expect(lists).to.not.be.null;
      expect(lists.length).to.equal(0);
      done(err);
    });
  });

  it('returns an empty array of groups if there is one list defined in sympa but there is no matching group in Softwerkskammer', function (done) {
    sympaStub.getAllAvailableLists = function (callback) {
      callback(null, ['unknownGroup']);
    };

    systemUnderTest.getAllAvailableGroups(function (err, lists) {
      expect(lists).to.not.be.null;
      expect(lists.length).to.equal(0);
      done(err);
    });
  });

  it('returns one group if there are two lists defined in sympa and there is one matching group in Softwerkskammer', function (done) {
    sympaStub.getAllAvailableLists = function (callback) {
      callback(null, ['GroupA', 'unknownGroup']);
    };

    systemUnderTest.getAllAvailableGroups(function (err, lists) {
      expect(lists).to.not.be.null;
      expect(lists.length).to.equal(1);
      expect(lists[0]).to.equal(GroupA);
      done(err);
    });
  });

  it('returns two groups if there are two lists defined in sympa and there are two matching groups in Softwerkskammer', function (done) {
    sympaStub.getAllAvailableLists = function (callback) {
      callback(null, ['GroupA', 'GroupB']);
    };

    systemUnderTest.getAllAvailableGroups(function (err, lists) {
      expect(lists).to.not.be.null;
      expect(lists.length).to.equal(2);
      expect(lists[0]).to.equal(GroupA);
      expect(lists[1]).to.equal(GroupB);
      done(err);
    });
  });

  it('returns an empty array of lists if there are no users subscribed to the list in sympa', function (done) {
    sympaStub.getUsersOfList = function (groupname, callback) {
      callback(null, []);
    };

    systemUnderTest.getSympaUsersOfList('groupname', function (err, lists) {
      expect(lists).to.not.be.null;
      expect(lists.length).to.equal(0);
      done(err);
    });
  });

  it('returns the users subscribed to the list in sympa', function (done) {
    sympaStub.getUsersOfList = function (groupname, callback) {
      callback(null, ['user1@mail1.de', 'user2@mail2.de', 'user3@mail3.de']);
    };

    systemUnderTest.getSympaUsersOfList('groupname', function (err, users) {
      expect(users).to.not.be.null;
      expect(users.length).to.equal(3);
      expect(users[0]).to.equal('user1@mail1.de');
      expect(users[1]).to.equal('user2@mail2.de');
      expect(users[2]).to.equal('user3@mail3.de');
      done(err);
    });
  });

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


  it('creates a new group by calling the appropriate sympa function', function (done) {
    var createListSpy = sinon.spy(sympaStub, 'createList');
    var saveGroupSpy = sinon.spy(groupstoreStub, 'saveGroup');

    systemUnderTest.createGroup(NonPersistentGroup, function (err, group) {
      expect(group).to.equal(NonPersistentGroup);
      expect(createListSpy.calledOnce).to.be.true;
      expect(saveGroupSpy.calledOnce).to.be.true;

      sympaStub.createList.restore();
      groupstoreStub.saveGroup.restore();
      done(err);
    });
  });

  it('saves a group by calling the appropriate groupstore function', function (done) {
    var saveGroupSpy = sinon.spy(groupstoreStub, 'saveGroup');

    systemUnderTest.saveGroup(GroupA, function (err, group) {
      expect(group).to.equal(GroupA);
      expect(saveGroupSpy.calledOnce).to.be.true;

      groupstoreStub.saveGroup.restore();
      done(err);
    });
  });

  it('creates a new group and saves it if there is no group with the given name', function (done) {
    var createListSpy = sinon.spy(sympaStub, 'createList');
    var saveGroupSpy = sinon.spy(groupstoreStub, 'saveGroup');

    systemUnderTest.createOrSaveGroup(NonPersistentGroup, function (err, group) {
      expect(group).to.equal(NonPersistentGroup);
      expect(createListSpy.calledOnce).to.be.true;
      expect(saveGroupSpy.calledOnce).to.be.true;

      sympaStub.createList.restore();
      groupstoreStub.saveGroup.restore();
      done(err);
    });
  });

  it('only saves the group if there already exists a group with the given name', function (done) {
    var createListSpy = sinon.spy(sympaStub, 'createList');
    var saveGroupSpy = sinon.spy(groupstoreStub, 'saveGroup');

    systemUnderTest.createOrSaveGroup(GroupA, function (err, group) {
      expect(group).to.equal(GroupA);
      expect(createListSpy.called).to.be.false;
      expect(saveGroupSpy.calledOnce).to.be.true;

      sympaStub.createList.restore();
      groupstoreStub.saveGroup.restore();
      done(err);
    });
  });

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

  it('returns true when there is already a group of this name present', function (done) {
    systemUnderTest.isGroupNamePresent("Gruppe A", function (err, result) {
      expect(result).to.be.not.null;
      expect(result).to.be.true;
      done();

    });

  });

  it('returns false when there is no group of this name present', function (done) {
    systemUnderTest.isGroupNamePresent("New Group", function (err, result) {
      expect(result).to.be.not.null;
      expect(result).to.be.false;
      done();
    });

  });

});
