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
    callback(null, ['test@me.de', 'michael@schumacher.de', 'michael@ballack.de', 'james@hetfield.com']);
  };


  var addUserToList = function (user, list, callback) {
    callback(null, true);
  };

  var removeUserFromList = function (user, list, callback) {
    callback(null, true);
  };



  var getSubscribedListsForUser = function (userEmail, callback) {
    callback(null, [
        {groupName: 'craftsmanswap'},
        {groupName: 'neueplattform'}
      ]);
  };

  client.getAllAvailableLists = getAllAvailableLists;
  client.getUsersOfList = getUsersOfList;
  client.getSubscribedListsForUser = getSubscribedListsForUser;
  client.addUserToList = addUserToList;
  client.removeUserFromList = removeUserFromList;
  client.createList = function (groupId, callback) { callback(null); };

  return client;
};

module.exports = createClient;