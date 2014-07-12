'use strict';

var conf = require('./../../testutil/configureForTest');
var expect = require('must');
var proxyquireStrict = require('proxyquire').noCallThru();

var soapsympastub = {createClient: function (url, callback) {
  callback(new Error('kkk'));
}};
var sympa = proxyquireStrict('../../lib/groups/sympa', {'soap-sympa': soapsympastub});

describe('The Sympa adapter', function () {
  afterEach(function () {
    delete soapsympastub.createClient;
  });

  describe(' - Standard Calls', function () {

    it('"getAllAvailableLists" - results transformed (suffix stripped)', function (done) {
      soapsympastub.createClient = function (url, callback) {
        callback(null, {authenticateRemoteAppAndRun: function (args, callback) {
          return callback(null, {listInfo: {item: [
            {listAddress: 'a@softwerkskammer.org'},
            {listAddress: 'b@softwerkskammer.org'}
          ]}});
        }});
      };

      sympa.getAllAvailableLists(function (err, result) {
        expect(result).to.contain('a');
        expect(result).to.contain('b');
        expect(result).to.not.contain('b@softwerkskammer.org');
        done(err);
      });

    });

    it('"getSubscribedListsForUser" - results transformed (suffix stripped)', function (done) {
      soapsympastub.createClient = function (url, callback) {
        callback(null, {authenticateRemoteAppAndRun: function (args, callback) {
          return callback(null, {return: {item: [
            {listAddress: 'a@softwerkskammer.org'},
            {listAddress: 'b@softwerkskammer.org'}
          ]}});
        }});
      };

      sympa.getSubscribedListsForUser('username', function (err, result) {
        expect(result).to.contain('a');
        expect(result).to.contain('b');
        expect(result).to.not.contain('b@softwerkskammer.org');
        done(err);
      });

    });

    it('"getUsersOfList" - results transformed  (suffix NOT stripped)', function (done) {
      soapsympastub.createClient = function (url, callback) {
        callback(null, {authenticateRemoteAppAndRun: function (args, callback) {
          return callback(null, {return: {item: [
            'a@softwerkskammer.org', 'b@softwerkskammer.org'
          ]}});
        }});
      };

      sympa.getUsersOfList('listname', function (err, result) {
        expect(result).to.contain('a@softwerkskammer.org');
        expect(result).to.contain('b@softwerkskammer.org');
        expect(result).to.not.contain('b');
        done(err);
      });

    });

  });

  describe('- Error handling', function () {

    it('handles adding an already added user', function (done) {
      soapsympastub.createClient = function (url, callback) {
        callback(new Error('Error: soap:Server: Unable to add user: User already member of list karlsruhe@softwerkskammer.org'));
      };

      sympa.addUserToList('email', 'listname', function (err) {
        done(err);
      });
    });

    it('handles adding an already removed user', function (done) {
      soapsympastub.createClient = function (url, callback) {
        callback(new Error('Error: soap:Client: Not subscribed: Not member of list or not subscribed'));
      };

      sympa.removeUserFromList('email', 'listname', function (err) {
        done(err);
      });
    });

  });
});
