'use strict';
var conf = require('nconf');
var soap = require('soap-sympa');
var transformer = conf.get('beans').get('sympaTransformer');
var url = __dirname + '/sympa.wsdl';

var listsuffix = '@' + conf.get('fqdn');

// the user should be handed over by the "client"
var remoteAppUser = conf.get('swkRemoteAppUser');

function callViaSoap(service, user, parameters, callback) {
  var args = {
    appname: conf.get('swkTrustedAppName'),
    apppassword: conf.get('swkTrustedAppPwd'),
    vars: 'USER_EMAIL=' + user,
    service: service,
    parameters: parameters
  };

  soap.createClient(url, function (err, soapClient) {
    if (err) { return callback(err); }
    soapClient.authenticateRemoteAppAndRun(args, function (err, result) {
      callback(err, result);
    });
  });
}

function retrieveLists(soapMethodName, user, propertyNameForLists, callback) {
  function dataAdapter(err, result) {
    callback(err, result ? transformer.stripMailSuffixes(transformer.inputItemToArray(result[propertyNameForLists])) : []);
  }
  callViaSoap(soapMethodName, user, undefined, dataAdapter);
}

function addOrRemoveUser(addOrRemove, email, list, errormessageRegexp, callback) {
  function callbackAfterErrorInspection(err) {
    if (err && err.message.match(errormessageRegexp)) {
      return callback();
    }
    callback(err);
  }
  callViaSoap(addOrRemove, remoteAppUser, [ list + listsuffix, email ], callbackAfterErrorInspection);
}

module.exports = {

  createList: function (list, prefix, callback) {
    callViaSoap('createList', remoteAppUser, [ list, prefix, 'softwerkskammer', '-', 'SWKListe' ], callback);
  },

  getAllAvailableLists: function (callback) {
    retrieveLists('complexLists', remoteAppUser, 'listInfo', callback);
  },

  getSubscribedListsForUser: function (user, callback) {
    retrieveLists('complexWhich', user, 'return', callback);
  },

  getUsersOfList: function (list, callback) {
    function dataAdapter(err, result) {
      callback(err, result ? transformer.inputItemToArray(result.return) : []);
    }
    callViaSoap('review', remoteAppUser, [ list + listsuffix ], dataAdapter);
  },

  addUserToList: function (email, list, callback) {
    addOrRemoveUser('add', email, list, /Unable to add user: User already member of list/, callback);
  },

  removeUserFromList: function (email, list, callback) {
    addOrRemoveUser('del', email, list, /Not subscribed: Not member of list or not subscribed/, callback);
  }

};
