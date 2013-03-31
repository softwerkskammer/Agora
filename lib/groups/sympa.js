"use strict";
var soap = require('soap');
var url = __dirname + '/sympa.wsdl';

module.exports = function (clientConfig) {
  var remoteAppArgs = {
    appname: clientConfig.get('swkTrustedAppName'),
    apppassword: clientConfig.get('swkTrustedAppPwd')
  };

  // the user should be handed over by the "client"
  var remoteAppUser = clientConfig.get('swkRemoteAppUser');

  var client = function () {
  };

  var initializeRequest = function (service, user, parameters, callback) {
    var args = remoteAppArgs;
    args.vars = 'USER_EMAIL=' + user;
    args.service = service;
    // check if parameters are really filled, and if it is not a function
    // because then it could be the callback
    args.parameters = parameters;

    soap.createClient(url, function (err, soapClient) {
      soapClient.authenticateRemoteAppAndRun(args, function (err, result) {
        callback(err, result);
      });

    });
  };

  // this method returns a list of available lists for the given user
  // a list has the following properties:
  // listAddress - e.g. craftsmanswap@softwerkskammer.de
  // subject - e.g. Organizing Software Craftsman Swaps
  var getAllAvailableLists = function (callback) {
    var parameters;

    initializeRequest('complexLists', remoteAppUser, parameters, callback);
  };

  var getUsersOfList = function (list, callback) {
    var parameters = [
      list
    ];


    initializeRequest('review', remoteAppUser, parameters, callback);
  };

  var addUserToList = function (user, list, callback) {
    var parameters = {
      list: list,
      email: user
    };

    initializeRequest('add', remoteAppUser, parameters, callback);
  };

  var removeUserFromList = function (user, list, callback) {
    var parameters = {
      list: list,
      email: user
    };

    initializeRequest('del', remoteAppUser, parameters, callback);
  };



  // the assigneLists returns an array with objects with the following
  // properties:
  // homepage -
  // isOwner: true/false
  // bounceCount:
  // listAddress:
  // subject:
  // isEditor: true/false
  // isSubscriber: true/false
  // in case of error, an empty list is returned


  var getSubscribedListsForUser = function (user, callback) {
    var parameters;


    // the user should be handed over by the clientConfig
    initializeRequest('complexWhich', user, parameters, callback);
  };

  client.getAllAvailableLists = getAllAvailableLists;
  client.getUsersOfList = getUsersOfList;
  client.getSubscribedListsForUser = getSubscribedListsForUser;
  client.addUserToList = addUserToList;
  client.removeUserFromList = removeUserFromList;

  return client;
};
