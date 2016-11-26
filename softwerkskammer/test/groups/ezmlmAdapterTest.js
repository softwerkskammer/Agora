'use strict';

const expect = require('must-dist');
const sinon = require('sinon').sandbox.create();
const proxyquire = require('proxyquire');

const ezmlmStub = {
  allLists: null,
  usersOfList: null,
  subscribeUserToList: null,
  unsubscribeUserFromList: null
};
const ezmlmAdapter = proxyquire('../../lib/groups/ezmlmAdapter', {'ezmlm-node': () => ezmlmStub});

describe('The ezmlm adapter', () => {

  afterEach(() => {
    sinon.restore();
  });

  describe(' - Standard Calls', () => {

    beforeEach(() => {
      sinon.stub(ezmlmStub, 'allLists', callback => { callback(null, ['a', 'b']); });
      sinon.stub(ezmlmStub, 'usersOfList', (listname, callback) => { // !!!always lowercase here!!!
        if (listname === 'a') { return callback(null, ['hans@here.org', 'gerd@there.org']); }
        callback(null, ['anna@localhost', 'gudrun@localhost']);
      });
      sinon.stub(ezmlmStub, 'subscribeUserToList', (user, list, callback) => {
        callback(null, {user: user, list: list});
      });
      sinon.stub(ezmlmStub, 'unsubscribeUserFromList', (user, list, callback) => {
        callback(null, {user: user, list: list});
      });
    });

    it('"getAllAvailableLists" - results is an Array of listnames without domain', done => {
      ezmlmAdapter.getAllAvailableLists((err, result) => {
        expect(result).to.contain('a');
        expect(result).to.contain('b');
        done(err);
      });
    });

    it('"getSubscribedListsForUser" - collects the right information', done => {
      ezmlmAdapter.getSubscribedListsForUser('Hans@here.org', (err, result) => {
        expect(result).to.contain('a');
        expect(result).to.not.contain('b');
        done(err);
      });
    });

    it('"getUsersOfList" - forwards the call', done => {
      ezmlmAdapter.getUsersOfList('listname', (err, result) => {
        expect(result).to.contain('anna@localhost');
        expect(result).to.contain('gudrun@localhost');
        done(err);
      });
    });

    it('"addUserToList" - forwards the call', done => {
      ezmlmAdapter.addUserToList('email', 'listname', (err, result) => {
        expect(result).to.have.ownProperty('user', 'email');
        expect(result).to.have.ownProperty('list', 'listname');
        done(err);
      });
    });

    it('"removeUserFromList" - forwards the call', done => {
      ezmlmAdapter.removeUserFromList('email', 'listname', (err, result) => {
        expect(result).to.have.ownProperty('user', 'email');
        expect(result).to.have.ownProperty('list', 'listname');
        done(err);
      });
    });
  });

  describe('- Error handling', () => {
    beforeEach(() => {
      sinon.stub(ezmlmStub, 'allLists', callback => callback(new Error()));
      sinon.stub(ezmlmStub, 'usersOfList', (listname, callback) => {
        if (listname === 'a') { return callback(new Error()); }
        callback(new Error());
      });
      sinon.stub(ezmlmStub, 'subscribeUserToList', (user, list, callback) => {
        callback(new Error());
      });
      sinon.stub(ezmlmStub, 'unsubscribeUserFromList', (user, list, callback) => {
        callback(new Error());
      });
    });

    it('"getAllAvailableLists" - passes error to callback', done => {
      ezmlmAdapter.getAllAvailableLists(err => {
        expect(err).to.exist();
        done();
      });
    });

    it('"getSubscribedListsForUser" - passes error to callback', done => {
      ezmlmAdapter.getSubscribedListsForUser('Hans@here.org', err => {
        expect(err).to.exist();
        done();
      });
    });

    it('"getUsersOfList" - passes error to callback', done => {
      ezmlmAdapter.getUsersOfList('listname', err => {
        expect(err).to.exist();
        done();
      });
    });

    it('"addUserToList" - passes error to callback', done => {
      ezmlmAdapter.addUserToList('email', 'listname', err => {
        expect(err).to.exist();
        done();
      });
    });

    it('"removeUserFromList" - passes error to callback', done => {
      ezmlmAdapter.removeUserFromList('email', 'listname', err => {
        expect(err).to.exist();
        done();
      });
    });

  });
});
