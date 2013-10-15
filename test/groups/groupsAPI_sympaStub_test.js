"use strict";

var sinon = require('sinon').sandbox;

var expect = require('chai').expect;

var beans = require('../configureForTest').get('beans');
var Group = beans.get('group');

var Craftsmanswap = new Group({id: 'craftsmanswap', longName: 'Gruppe A', description: 'Dies ist Gruppe A.', type: 'Themengruppe'});
var NeuePlattform = new Group({id: 'neueplattform', longName: 'Gruppe B', description: 'Dies ist Gruppe B.', type: 'Regionalgruppe'});
var NonPersistentGroup = new Group({id: 'Group C', longName: 'Gruppe C', description: 'Dies ist Gruppe C.', type: 'Regionalgruppe'});

var groupstore = beans.get('groupstore');
var systemUnderTest = beans.get('groupsAPI');

describe('Groups API with SympaStub', function () {
  var saveGroupSpy;

  before(function (done) {
    sinon.stub(groupstore, 'allGroups', function (callback) { callback(null, [Craftsmanswap, NeuePlattform]); });
    sinon.stub(groupstore, 'getGroup', function (name, callback) {
      if (name === 'craftsmanswap') {
        callback(null, Craftsmanswap);
      } else if (name === 'neueplattform') {
        callback(null, NeuePlattform);
      } else {
        callback(null, null);
      }
    });
    saveGroupSpy = sinon.stub(groupstore, 'saveGroup', function (group, callback) { callback(null, group); });
    done();
  });

  after(function (done) {
    sinon.restore();
    done();
  });


  it('returns two groups for a user who is mentioned in the stub', function (done) {
    sinon.stub(groupstore, 'groupsByLists', function (lists, globalCallback) {
      globalCallback(null, [Craftsmanswap, NeuePlattform]);
    });

    systemUnderTest.getSubscribedGroupsForUser('michael@schumacher.de', function (err, validLists) {
      expect(validLists).to.not.be.null;
      expect(validLists.length).to.equal(2);
      expect(validLists[0]).to.equal(Craftsmanswap);
      expect(validLists[1]).to.equal(NeuePlattform);
      groupstore.groupsByLists.restore();
      done(err);
    });
  });

  it('returns two groups for the two lists defined in the stub', function (done) {
    sinon.stub(groupstore, 'groupsByLists', function (lists, globalCallback) {
      globalCallback(null, [Craftsmanswap, NeuePlattform]);
    });

    systemUnderTest.getAllAvailableGroups(function (err, lists) {
      expect(lists).to.not.be.null;
      expect(lists.length).to.equal(2);
      expect(lists[0]).to.equal(Craftsmanswap);
      expect(lists[1]).to.equal(NeuePlattform);
      groupstore.groupsByLists.restore();
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

    systemUnderTest.createOrSaveGroup(NonPersistentGroup, function (err, group) {
      expect(group).to.equal(NonPersistentGroup);
      expect(saveGroupSpy.calledOnce).to.be.true;
      done(err);
    });
  });

});
