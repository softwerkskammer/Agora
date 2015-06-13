'use strict';

var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();
var proxyquire = require('proxyquire');

var ezmlmStub = {
  allLists: null,
  usersOfList: null,
  subscribeUserToList: null,
  unsubscribeUserFromList: null
};
var ezmlmAdapter = proxyquire('../../lib/groups/ezmlmAdapter', {'ezmlm-node': function () { return ezmlmStub; }});

describe('The ezmlm adapter', function () {

  afterEach(function () {
    sinon.restore();
  });

  describe(' - Standard Calls', function () {
    beforeEach(function () {
      sinon.stub(ezmlmStub, 'allLists', function (callback) { callback(null, ['a', 'b']); });
      sinon.stub(ezmlmStub, 'usersOfList', function (listname, callback) { // !!!always lowercase here!!!
        if (listname === 'a') { return callback(null, ['hans@here.org', 'gerd@there.org']); }
        callback(null, ['anna@localhost', 'gudrun@localhost']);
      });
      sinon.stub(ezmlmStub, 'subscribeUserToList', function (user, list, callback) {
        callback(null, {user: user, list: list});
      });
      sinon.stub(ezmlmStub, 'unsubscribeUserFromList', function (user, list, callback) {
        callback(null, {user: user, list: list});
      });
    });

    it('"getAllAvailableLists" - results is an Array of listnames without domain', function (done) {
      ezmlmAdapter.getAllAvailableLists(function (err, result) {
        expect(result).to.contain('a');
        expect(result).to.contain('b');
        done(err);
      });
    });

    it('"getSubscribedListsForUser" - collects the right information', function (done) {
      ezmlmAdapter.getSubscribedListsForUser('Hans@here.org', function (err, result) {
        expect(result).to.contain('a');
        expect(result).to.not.contain('b');
        done(err);
      });
    });

    it('"getUsersOfList" - forwards the call', function (done) {
      ezmlmAdapter.getUsersOfList('listname', function (err, result) {
        expect(result).to.contain('anna@localhost');
        expect(result).to.contain('gudrun@localhost');
        done(err);
      });
    });

    it('"addUserToList" - forwards the call', function (done) {
      ezmlmAdapter.addUserToList('email', 'listname', function (err, result) {
        expect(result).to.have.ownProperty('user', 'email');
        expect(result).to.have.ownProperty('list', 'listname');
        done(err);
      });
    });

    it('"removeUserFromList" - forwards the call', function (done) {
      ezmlmAdapter.removeUserFromList('email', 'listname', function (err, result) {
        expect(result).to.have.ownProperty('user', 'email');
        expect(result).to.have.ownProperty('list', 'listname');
        done(err);
      });
    });
  });

  describe('- Error handling', function () {
    beforeEach(function () {
      sinon.stub(ezmlmStub, 'allLists', function (callback) { callback(new Error()); });
      sinon.stub(ezmlmStub, 'usersOfList', function (listname, callback) {
        if (listname === 'a') { return callback(new Error()); }
        callback(new Error());
      });
      sinon.stub(ezmlmStub, 'subscribeUserToList', function (user, list, callback) {
        callback(new Error());
      });
      sinon.stub(ezmlmStub, 'unsubscribeUserFromList', function (user, list, callback) {
        callback(new Error());
      });
    });

    it('"getAllAvailableLists" - passes error to callback', function (done) {
      ezmlmAdapter.getAllAvailableLists(function (err) {
        expect(err).to.exist();
        done();
      });
    });

    it('"getSubscribedListsForUser" - passes error to callback', function (done) {
      ezmlmAdapter.getSubscribedListsForUser('Hans@here.org', function (err) {
        expect(err).to.exist();
        done();
      });
    });

    it('"getUsersOfList" - passes error to callback', function (done) {
      ezmlmAdapter.getUsersOfList('listname', function (err) {
        expect(err).to.exist();
        done();
      });
    });

    it('"addUserToList" - passes error to callback', function (done) {
      ezmlmAdapter.addUserToList('email', 'listname', function (err) {
        expect(err).to.exist();
        done();
      });
    });

    it('"removeUserFromList" - passes error to callback', function (done) {
      ezmlmAdapter.removeUserFromList('email', 'listname', function (err) {
        expect(err).to.exist();
        done();
      });
    });

  });
});
