/*global describe, it */
"use strict";
var proxyquire = require('proxyquire'),
  sinon = require('sinon');

var expect = require('chai').expect;

var Group = require('../../lib/groups/group');

var Craftsmanswap = new Group({id: 'craftsmanswap', longName: 'Gruppe A', description: 'Dies ist Gruppe A.', type: 'Themengruppe'});
var NeuePlattform = new Group({id: 'neueplattform', longName: 'Gruppe B', description: 'Dies ist Gruppe B.', type: 'Regionalgruppe'});
var NonPersistentGroup = new Group({id: 'Group C', longName: 'Gruppe C', description: 'Dies ist Gruppe C.', type: 'Regionalgruppe'});

var groupstoreStub = {
  allGroups: function (callback) { callback(null, [Craftsmanswap, NeuePlattform]); },
  getGroup: function (name, callback) {
    if (name === 'craftsmanswap') {
      callback(null, Craftsmanswap);
    } else if (name === 'neueplattform') {
      callback(null, NeuePlattform);
    } else {
      callback(null, null);
    }
  },
  saveGroup: function (group, callback) { callback(null, group); },
  groupsByLists: function () {}
};

var groupsAPI = proxyquire('../../lib/groups/groupsAPI', {'./groupstore': groupstoreStub});

var systemUnderTest = groupsAPI;

describe('Groups API with SympaStub', function () {

  it('returns two groups for a user who is mentioned in the stub', function (done) {
    groupstoreStub.groupsByLists = function (lists, globalCallback) {
      globalCallback(null, [Craftsmanswap, NeuePlattform]);
    };

    systemUnderTest.getSubscribedGroupsForUser('michael@schumacher.de', function (err, validLists) {
      expect(validLists).to.not.be.null;
      expect(validLists.length).to.equal(2);
      expect(validLists[0]).to.equal(Craftsmanswap);
      expect(validLists[1]).to.equal(NeuePlattform);
      done(err);
    });
  });

  it('returns two groups for the two lists defined in the stub', function (done) {
    groupstoreStub.groupsByLists = function (lists, globalCallback) {
      globalCallback(null, [Craftsmanswap, NeuePlattform]);
    };

    systemUnderTest.getAllAvailableGroups(function (err, lists) {
      expect(lists).to.not.be.null;
      expect(lists.length).to.equal(2);
      expect(lists[0]).to.equal(Craftsmanswap);
      expect(lists[1]).to.equal(NeuePlattform);
      done(err);
    });
  });

  it('returns the users subscribed to the list in the stub', function (done) {
    systemUnderTest.getSympaUsersOfList('craftsmanswap', function (err, users) {
      expect(users).to.not.be.null;
      expect(users.length).to.equal(4);
      expect(users[0]).to.equal('test@me.de');
      expect(users[1]).to.equal('michael@schumacher.de');
      expect(users[2]).to.equal('michael@ballack.de');
      expect(users[3]).to.equal('james@hetfield.com');
      done(err);
    });
  });

  it('returns the group if there is a group with the given name', function (done) {

    systemUnderTest.getGroup('craftsmanswap', function (err, group) {
      expect(group).to.equal(Craftsmanswap);
      done(err);
    });
  });

  it('can handle the creation of a new group', function (done) {
    var saveGroupSpy = sinon.spy(groupstoreStub, 'saveGroup');

    systemUnderTest.createOrSaveGroup(NonPersistentGroup, function (err, group) {
      expect(group).to.equal(NonPersistentGroup);
      expect(saveGroupSpy.calledOnce).to.be.true;

      groupstoreStub.saveGroup.restore();
      done(err);
    });
  });

});
