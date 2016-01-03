'use strict';

var chado = require('chado');
var cb = chado.callback;
var assume = chado.assume;

var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTest').get('beans');

var expect = require('must-dist');

var Member = beans.get('member');

var dummymember = new Member({id: 'hada', email: 'Email1'});
var dummymember2 = new Member({id: 'hada2', email: 'email2'});

var groupsForTest = require('../groups/groups_for_tests');
var GroupA = groupsForTest.GroupA;
var GroupB = groupsForTest.GroupB;

var memberstore = beans.get('memberstore');
var groupsService = beans.get('groupsService');

var groupsAndMembersService = beans.get('groupsAndMembersService');

describe('Groups and Members Service (getAllMembersWithTheirGroups)', function () {

  beforeEach(function () {
    sinon.stub(groupsService, 'getAllAvailableGroups', function (callback) {
      callback(null, [GroupA, GroupB]);
    });
    chado.createDouble('groupsService', groupsService);
  });

  afterEach(function () {
    sinon.restore();
    chado.reset();
  });

  it('returns no members when there are no members', function (done) {
    sinon.stub(memberstore, 'allMembers', function (callback) {
      callback(null, []);
    });
    assume(groupsService).canHandle('getMailinglistUsersOfList').withArgs('groupa', cb).andCallsCallbackWith(null, []);
    assume(groupsService).canHandle('getMailinglistUsersOfList').withArgs('groupb', cb).andCallsCallbackWith(null, []);

    groupsAndMembersService.getAllMembersWithTheirGroups(function (err, members, infos) {
      expect(members).to.be.empty();
      expect(infos).to.be.empty();
      done(err);
    });
  });

  it('returns a member and his groups when there is a member who has groups', function (done) {
    sinon.stub(memberstore, 'allMembers', function (callback) {
      callback(null, [dummymember]);
    });
    assume(groupsService).canHandle('getMailinglistUsersOfList').withArgs('groupa', cb).andCallsCallbackWith(null, ['email1']);
    assume(groupsService).canHandle('getMailinglistUsersOfList').withArgs('groupb', cb).andCallsCallbackWith(null, ['email1']);

    groupsAndMembersService.getAllMembersWithTheirGroups(function (err, members) {
      expect(members.length).to.equal(1);
      expect(members[0]).to.equal(dummymember);
      expect(members[0].subscribedGroups).to.not.be(null);
      expect(members[0].subscribedGroups).to.have.length(2);
      expect(members[0].subscribedGroups[0]).to.equal(GroupA);
      expect(members[0].subscribedGroups[1]).to.equal(GroupB);
      done(err);
    });
  });

  it('returns a member and his only group when there is a member who has only 1 subscribed group', function (done) {
    sinon.stub(memberstore, 'allMembers', function (callback) {
      callback(null, [dummymember]);
    });
    assume(groupsService).canHandle('getMailinglistUsersOfList').withArgs('groupa', cb).andCallsCallbackWith(null, ['email1']);
    assume(groupsService).canHandle('getMailinglistUsersOfList').withArgs('groupb', cb).andCallsCallbackWith(null, []);

    groupsAndMembersService.getAllMembersWithTheirGroups(function (err, members) {
      expect(members.length).to.equal(1);
      expect(members[0]).to.equal(dummymember);
      expect(members[0].subscribedGroups).to.not.be(null);
      expect(members[0].subscribedGroups).to.have.length(1);
      expect(members[0].subscribedGroups[0]).to.equal(GroupA);
      done(err);
    });
  });

  it('returns a member without groups when there is a member who has no groups', function (done) {
    sinon.stub(memberstore, 'allMembers', function (callback) {
      callback(null, [dummymember]);
    });
    assume(groupsService).canHandle('getMailinglistUsersOfList').withArgs('groupa', cb).andCallsCallbackWith(null, []);
    assume(groupsService).canHandle('getMailinglistUsersOfList').withArgs('groupb', cb).andCallsCallbackWith(null, []);

    groupsAndMembersService.getAllMembersWithTheirGroups(function (err, members) {
      expect(members.length).to.equal(1);
      expect(members[0]).to.equal(dummymember);
      expect(members[0].subscribedGroups).to.not.be(null);
      expect(members[0].subscribedGroups).to.have.length(0);
      done(err);
    });
  });

  it('returns a member with and one without groups', function (done) {
    sinon.stub(memberstore, 'allMembers', function (callback) {
      callback(null, [dummymember, dummymember2]);
    });
    assume(groupsService).canHandle('getMailinglistUsersOfList').withArgs('groupa', cb).andCallsCallbackWith(null, ['email1']);
    assume(groupsService).canHandle('getMailinglistUsersOfList').withArgs('groupb', cb).andCallsCallbackWith(null, ['email1']);

    groupsAndMembersService.getAllMembersWithTheirGroups(function (err, members) {
      expect(members).to.have.length(2);
      expect(members[0]).to.equal(dummymember);
      expect(members[0].subscribedGroups).to.not.be(null);
      expect(members[0].subscribedGroups).to.have.length(2);
      expect(members[0].subscribedGroups[0]).to.equal(GroupA);
      expect(members[0].subscribedGroups[1]).to.equal(GroupB);
      expect(members[1]).to.equal(dummymember2);
      expect(members[1].subscribedGroups).to.not.be(null);
      expect(members[1].subscribedGroups).to.have.length(0);
      done(err);
    });
  });

  it('returns an additional email address in GroupA when there is no member for this email address', function (done) {
    sinon.stub(memberstore, 'allMembers', function (callback) {
      callback(null, [dummymember, dummymember2]);
    });
    assume(groupsService).canHandle('getMailinglistUsersOfList').withArgs('groupa', cb).andCallsCallbackWith(null, ['email1', 'email2', 'email3']);
    assume(groupsService).canHandle('getMailinglistUsersOfList').withArgs('groupb', cb).andCallsCallbackWith(null, []);

    groupsAndMembersService.getAllMembersWithTheirGroups(function (err, members, infos) {
      expect(infos).to.have.length(1);
      expect(infos[0].group).to.equal('groupa');
      expect(infos[0].extraAddresses).to.contain('email3');
      done(err);
    });
  });

  it('returns no additional email address in GroupA just because of case sensitivity', function (done) {
    sinon.stub(memberstore, 'allMembers', function (callback) {
      callback(null, [dummymember, dummymember2]);
    });
    assume(groupsService).canHandle('getMailinglistUsersOfList').withArgs('groupa', cb).andCallsCallbackWith(null, ['email1']);
    assume(groupsService).canHandle('getMailinglistUsersOfList').withArgs('groupb', cb).andCallsCallbackWith(null, []);

    groupsAndMembersService.getAllMembersWithTheirGroups(function (err, members, infos) {
      expect(infos).to.be.empty();
      done(err);
    });
  });
});
