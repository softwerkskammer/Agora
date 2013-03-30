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
  //TODO hgp make it configurable
  var getAllAvailableLists = function (callback) {

    var item =
      [
        {homepage: 'http://swk.monoceres.uberspace.de/fcgi-bin/sympa.fcgi/info/craftsmanswap',
          subject: 'Organizing Software Craftsman Swaps',
          listAdress: 'craftsmanswap@softwerkskammer.de'},
        {homepage: 'http://swk.monoceres.uberspace.de/fcgi-bin/sympa.fcgi/info/neueplattform',
          subject: 'Die neue Softwerkskammer-Plattform',
          listAdress: 'neueplattform@softwerkskammer.de'}
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


  var getGroups = function () {

    throw "'getGroups' no longer supported";
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
    var item =
      [
        {subject: 'Organizing Software Craftsman Swaps',
          bounceCount: '0',
          listAdress: 'craftsmanswap@softwerkskammer.de',
          homepage: 'http://swk.monoceres.uberspace.de/fcgi-bin/sympa.fcgi/info/craftsmanswap',
          isOwner: 'false',
          isEditor: 'false',
          isSubscriber: 'true'
        },
        {homepage: 'http://swk.monoceres.uberspace.de/fcgi-bin/sympa.fcgi/info/neueplattform',
          subject: 'Die neue Softwerkskammer-Plattform',
          listAdress: 'neueplattform@softwerkskammer.de',
          bounceCount: '1',
          isOwner: 'false',
          isEditor: 'true',
          isSubscriber: 'true'
        }
      ];
    callback(null, item);
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