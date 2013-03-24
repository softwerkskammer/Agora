"use strict";
var soap = require('soap');
var url = __dirname + '/sympa.wsdl';

var createClient = function (clientConfig) {
  var baseUrl = process.env.REMOTE_APP_URL || clientConfig.baseUrl || 'http://swk.monoceres.uberspace.de/fcgi-bin/sympa.fcgi/wsdl#';
  var remoteAppArgs = {
    appname: process.env.REMOTE_APP_NAME || clientConfig.appname || 'dummyapp',
    apppassword: process.env.REMOTE_APP_PWD || clientConfig.apppassword || 'dummypwd'
  };

  // the user should be handed over by the "client"
  var remoteAppUser = process.env.REMOTE_APP_USER || clientConfig.remoteAppUser || 'dummyuser';

  var client = function () {};

  var initializeRequest = function (service, user, parameters, callback) {
    var methodUrl = baseUrl + 'authenticateRemoteAppAndRun';

    var args = remoteAppArgs;
    args.vars = 'USER_EMAIL=' + user;
    args.service = service;
    // check if parameters are really filled, and if it is not a function
    // because then it could be the callback
    args.parameters = parameters;

    soap.createClient(url, function (err, soapClient) {
      soapClient.SOAPAction = function () {
        return methodUrl;
      };

      soapClient.authenticateRemoteAppAndRun(args, function (err, result, body) {
        callback(err, result, body);
      });

    });
  };

  // this method returns a list of available lists for the given user
  var getLists = function (callback) {
    var parameters;

    initializeRequest('lists', remoteAppUser, parameters, callback);
  };

  // this is just a dummy method to use for testing purposes,
  // needs to get removed as soon as this interface is working correctly
  var getGroups = function (callback) {
    callback(null, [{id: 'dummy id 1', name: 'dummy name 1'}, {id: 'dummy id 2', name: 'dummy name 2'}]);
  };

  // right now the username and its parameters are hardcoded, this should
  // get handed over by the client as well
  var getInfoRequest = function (callback) {
    var parameters = {
      listname: 'neueplattform'
    };

    // the user should be handed over by the clientConfig
    initializeRequest('info', remoteAppUser, parameters, callback);
  };

  client.getInfoRequest = getInfoRequest;
  client.getGroups = getGroups;
  client.getLists = getLists;

  return client;
};

module.exports = createClient;