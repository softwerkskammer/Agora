"use strict";
var soap = require('soap');
var url = __dirname + '/sympa.wsdl';

var createClient = function (clientConfig) {
  var remoteAppArgs = {
    appname: process.env.REMOTE_APP_NAME || clientConfig.appname || 'dummyapp',
    apppassword: process.env.REMOTE_APP_PWD || clientConfig.apppassword || 'dummypwd'
  };

  // the user should be handed over by the "client"
  var remoteAppUser = process.env.REMOTE_APP_USER || clientConfig.remoteAppUser || 'dummyuser';

  var client = function () {};

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
      var items = result.listInfo.item;
      callback(err, items);
    };

    initializeRequest('complexLists', remoteAppUser, parameters, dataAdapter);
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

  // this is just a dummy method to use for testing purposes,
  // needs to get removed as soon as this interface is working correctly
  var getGroups = function (callback) {
    callback(null, [{id: 'dummy id 1', name: 'dummy name 1'}, {id: 'dummy id 2', name: 'dummy name 2'}]);
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
  var getSubscribedListsForUser = function (userEmail, callback) {
    var parameters;

    var dataAdapter = function (err, result) {
      var items = result.return.item;
      callback(err, items);
    };

    // the user should be handed over by the clientConfig
    initializeRequest('complexWhich', userEmail, parameters, dataAdapter);
  };

  client.getGroups = getGroups;
  client.getAllAvailableLists = getAllAvailableLists;
  client.getUsersOfList = getUsersOfList;
  client.getSubscribedListsForUser = getSubscribedListsForUser;
  client.addUserToList = addUserToList;
  client.removeUserFromList = removeUserFromList;

  return client;
};

module.exports = createClient;