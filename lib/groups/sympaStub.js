"use strict";

/**
 *
 * Stub für den SympaClient der nicht gegen den SOAP Server geht
 * @param clientConfig
 * @returns {Function}
 */
var createClient = function () {


  var client = function () {
  };

  //just a demo, how does a response look like
  var getAllAvailableLists = function (callback) {

    var item =
      [
        {groupName: 'craftsmanswap'},
        {groupName: 'neueplattform'}
      ];
    callback(null, item);
  };

  var getUsersOfList = function (list, callback) {
    var item =
      ['test@me.de', 'michael@schumacher.de', 'michael@ballack.de', 'james@hetfield.com'];
    callback(null, item);
  };


  var addUserToList = function (user, list, callback) {

    var item = true;

    callback(null, item);

  };

  var removeUserFromList = function (user, list, callback) {

    var item = true;

    callback(null, item);
  };



  var getSubscribedListsForUser = function (userEmail, callback) {
    var item =
      [
        {listAddress: 'craftsmanswap'},
        {listAddress: 'neueplattform'}
      ];


    callback(null, item);
  };

  client.getAllAvailableLists = getAllAvailableLists;
  client.getUsersOfList = getUsersOfList;
  client.getSubscribedListsForUser = getSubscribedListsForUser;
  client.addUserToList = addUserToList;
  client.removeUserFromList = removeUserFromList;

  return client;
};

module.exports = createClient;