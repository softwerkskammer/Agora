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

    var dataAdapter = function (err, result) {
      //TOD hgp/mmm Fehlerbehandlung
      var items = result.listInfo.item;
      callback(err, items);
    };


    initializeRequest('complexLists', remoteAppUser, parameters, dataAdapter);
  };

  var getUsersOfList = function (list, callback) {
    var parameters = [
      list
    ];
    var dataAdapter = function (err, result) {
      //TOD hgp/mmm Fehlerbehandlung
      var items = result.return.item;
      callback(err, items);
    };

    initializeRequest('review', remoteAppUser, parameters, dataAdapter);
  };

  var addUserToList = function (user, list, callback) {
    var parameters = {
      list: list,
      email: user
    };

    var dataAdapter = function (err, result) {
      //TOD hgp/mmm Fehlerbehandlung
      var item = result.return.item;
      callback(err, item);
    };

    initializeRequest('add', remoteAppUser, parameters, dataAdapter);
  };

  var removeUserFromList = function (user, list, callback) {
    var parameters = {
      list: list,
      email: user
    };

    initializeRequest('del', remoteAppUser, parameters, callback);
  };

  var getGroups = function () {

    throw "getGroups' no longer supported";
  };

  // right now the username and its parameters are hardcoded, this should
  // get handed over by the client as well
  // the assigneLists returns an array with objects with the following
  // properties:
  // homepage -
  // isOwner: true/false
  // bounceCount:
  // listAddress:
  // subject:
  // isEditor: true/false
  // isSubscriber: true/false
  var getSubscribedListsForUser = function (user, callback) {
    var parameters;

    var dataAdapter = function (err, result) {
      //TOD hgp/mmm Fehlerbehandlung
      var items = result.return.item;
      callback(err, items);
    };

    // the user should be handed over by the clientConfig
    initializeRequest('complexWhich', user, parameters, dataAdapter);
  };

  client.getGroups = getGroups;
  client.getAllAvailableLists = getAllAvailableLists;
  client.getUsersOfList = getUsersOfList;
  client.getSubscribedListsForUser = getSubscribedListsForUser;
  client.addUserToList = addUserToList;
  client.removeUserFromList = removeUserFromList;

  return client;
};
