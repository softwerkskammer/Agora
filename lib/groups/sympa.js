"use strict";
var soap = require('soap-sympa');
var transformer = require('./sympaTransformer')();
var url = __dirname + '/sympa.wsdl';


module.exports = function (conf) {
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
      soapClient.authenticateRemoteAppAndRun(args, function (err, result) {
        callback(err, result);
      });

    });
  };

  return {

    createList: function (list, callback) {
      var parameters = [
        list,
        '-',
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
      var parameters;

      var dataAdapter = function (err, result) {
        var items = [];
        if (result) {
          items = transformer.toArray(result.listInfo);
        }
        callback(err, transformer.stripMailSuffixes(items));
      };

      initializeRequest('complexLists', remoteAppUser, parameters, dataAdapter);
    },

    getUsersOfList: function (list, callback) {
      var parameters = [
        list + '@softwerkskammer.de'
      ];
      var dataAdapter = function (err, result) {
        var items = [];
        if (result) {
          items = transformer.toArray(result.return);
        }
        callback(err, items);
      };

      initializeRequest('review', remoteAppUser, parameters, dataAdapter);
    },

    getSubscribedListsForUser: function (user, callback) {
      var parameters;

      var dataAdapter = function (err, result) {
        var items = [];
        if (result) {
          items = transformer.toArray(result.return);
        }
        callback(err, transformer.stripMailSuffixes(items));
      };

      initializeRequest('complexWhich', user, parameters, dataAdapter);
    },

    addUserToList: function (user, list, callback) {
      var parameters = {
        list: list,
        email: user
      };

      var dataAdapter = function (err, result) {
        var item = [];
        if (result && result.return && result.return.item) {
          item = result.return.item;
        }
        callback(err, item);
      };

      initializeRequest('add', remoteAppUser, parameters, dataAdapter);
    },

    removeUserFromList: function (user, list, callback) {
      var parameters = {
        list: list,
        email: user
      };

      initializeRequest('del', remoteAppUser, parameters, callback);
    }

  };
};
