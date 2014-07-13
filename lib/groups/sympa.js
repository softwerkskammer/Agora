'use strict';
var conf = require('nconf');
var soap = require('soap-sympa');
var transformer = conf.get('beans').get('sympaTransformer');
var url = __dirname + '/sympa.wsdl';

var remoteAppArgs = {
  appname: conf.get('swkTrustedAppName'),
  apppassword: conf.get('swkTrustedAppPwd')
};

// the user should be handed over by the "client"
var remoteAppUser = conf.get('swkRemoteAppUser');

var initializeRequest = function (service, user, parameters, callback) {
  var args = remoteAppArgs;
  args.vars = 'USER_EMAIL=' + user;
  args.service = service;
  args.parameters = parameters;

  soap.createClient(url, function (err, soapClient) {
    if (err) { return callback(err); }
    soapClient.authenticateRemoteAppAndRun(args, function (err, result) {
      callback(err, result);
    });

  });
};

module.exports = {

  createList: function (list, prefix, callback) {
    var parameters = [
      list,
      prefix,
      'softwerkskammer',
      '-',
      'SWKListe'
    ];
    var dataAdapter = function (err, result) {
      var outcome = false;
      if (result && result.return && result.return.item) {
        outcome = result.return.item;
      }
      callback(err, outcome);
    };

    initializeRequest('createList', remoteAppUser, parameters, dataAdapter);
  },

  getAllAvailableLists: function (callback) {
    var dataAdapter = function (err, result) {
      var items = [];
      if (result) {
        items = transformer.inputItemToArray(result.listInfo);
      }
      callback(err, transformer.stripMailSuffixes(items));
    };

    initializeRequest('complexLists', remoteAppUser, undefined, dataAdapter);
  },

  getUsersOfList: function (list, callback) {
    var parameters = [
      list + '@softwerkskammer.org'
    ];
    var dataAdapter = function (err, result) {
      var items = [];
      if (result) {
        items = transformer.inputItemToArray(result.return);
      }
      callback(err, items);
    };

    initializeRequest('review', remoteAppUser, parameters, dataAdapter);
  },

  getSubscribedListsForUser: function (user, callback) {
    var dataAdapter = function (err, result) {
      var items = [];
      if (result) {
        items = transformer.inputItemToArray(result.return);
      }
      callback(err, transformer.stripMailSuffixes(items));
    };

    initializeRequest('complexWhich', user, undefined, dataAdapter);
  },

  addUserToList: function (email, list, callback) {
    var listaddress = list + '@softwerkskammer.org';
    var parameters = [
      listaddress,
      email
    ];

    var dataAdapter = function (err, result) {
      var item = [];
      if (result && result.return && result.return.item) {
        item = result.return.item;
      }
      if (err && err.message.match(/Unable to add user: User already member of list/)) {
        return callback();
      }
      callback(err, item);
    };

    initializeRequest('add', remoteAppUser, parameters, dataAdapter);
  },

  removeUserFromList: function (email, list, callback) {
    var parameters = [
      list + '@softwerkskammer.org',
      email
    ];

    var dataAdapter = function (err, result) {
      if (err && err.message.match(/Not subscribed: Not member of list or not subscribed/)) {
        return callback();
      }
      callback(err);
    };
    initializeRequest('del', remoteAppUser, parameters, dataAdapter);
  }

};
