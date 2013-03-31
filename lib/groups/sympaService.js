"use strict";
/**
 * Delegates to the more low level SOAP function of sympa.js
 * Transforms lowlevel SOAP Model to SWK Domain
 **/

var _s = require('underscore.string');


module.exports = function (conf) {
  var sympaClient;
  //Just checking if remote has been configured, replace by nconf
  if (!_s.isBlank(process.env.REMOTE_APP_NAME) || !_s.isBlank(process.env.REMOTE_APP_PWD)) {
    sympaClient = require('./sympa')(conf);
  }
  else {
    sympaClient = require('./sympaStub')({});
  }

  var service = function () {
  };

  var getAllAvailableLists = function (callback) {
    var dataAdapter = function (err, result) {
      //TOD hgp/mmm Fehlerbehandlung
      var items = result.listInfo.item;
      callback(err, items);
    };

    sympaClient.getAllAvailableLists(dataAdapter);
  };

  var getUsersOfList = function (list, callback) {

    var dataAdapter = function (err, result) {
      //TOD hgp/mmm Fehlerbehandlung
      var items = result.return.item;
      callback(err, items);
    };

    sympaClient.getUsersOfList(list, dataAdapter);
  };

  var addUserToList = function (user, list, callback) {


    var dataAdapter = function (err, result) {
      var payload = [];

      var returnContainer = result.return;

      if (returnContainer === null) {
        console.error("Result does not contain a 'return' element!");
      }
      else {
        var item = result.return.item;
        if (item === null) {
          console.error("Result does not contain a 'item' element!");
        }
        else {
          payload = item;
        }
      }
      callback(err, payload);


    };

    sympaClient.addUserToList(user, list, dataAdapter);
  };


  var removeUserFromList = function (user, list, callback) {
    var dataAdapter = function (err, result) {
      var payload = [];

      var returnContainer = result.return;

      if (returnContainer === null) {
        console.error("Result does not contain a 'return' element!");
      }
      else {
        var item = result.return.item;
        if (item === null) {
          console.error("Result does not contain a 'item' element!");
        }
        else {
          payload = item;
        }
      }
      callback(err, payload);

    };

    sympaClient.removeUserFromList(user, list, dataAdapter);
  };

  var getSubscribedListsForUser = function (user, callback) {

    var dataAdapter = function (err, result) {

      var payload = [];
      var returnContainer = result.return;

      if (returnContainer == null) {
        console.error("Result does not contain a 'return' element!");
      }
      var items = returnContainer.item;

      if (items == null) {
        console.error("Result does not contain a 'item' element!");
      }

      payload = items;
      callback(err, payload);
    };


    sympaClient.getSubscribedListsForUser(user, dataAdapter);
  };


  service.getAllAvailableLists = getAllAvailableLists;
  service.getUsersOfList = getUsersOfList;
  service.getSubscribedListsForUser = getSubscribedListsForUser;
  service.addUserToList = addUserToList;
  service.removeUserFromList = removeUserFromList;
  return service;
};


