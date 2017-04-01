'use strict';

const expect = require('must-dist');
const proxyquire = require('proxyquire');

const ezmlmStub = {
  allLists: callback => { callback(null, ['a', 'b']); },
  usersOfList: (listname, callback) => { // !!!always lowercase here!!!
    if (listname === 'a') { return callback(null, ['hans@here.org', 'gerd@there.org']); }
    callback(null, ['anna@localhost', 'gudrun@localhost']);
  },
  subscribeUserToList: (user, list, callback) => {
    callback(null, {user, list});
  },
  unsubscribeUserFromList: (user, list, callback) => {
    callback(null, {user, list});
  }
};
const ezmlmAdapter = proxyquire('../../lib/groups/ezmlmAdapter', {'ezmlm-node': () => ezmlmStub});

describe('The ezmlm adapter', () => {

  describe(' - Standard Calls', () => {

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
      ezmlmStub.allLists = callback => callback(new Error());
      ezmlmStub.usersOfList = (listname, callback) => {
        if (listname === 'a') { return callback(new Error()); }
        callback(new Error());
      };
      ezmlmStub.subscribeUserToList = (user, list, callback) => {
        callback(new Error());
      };
      ezmlmStub.unsubscribeUserFromList = (user, list, callback) => {
        callback(new Error());
      };
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
