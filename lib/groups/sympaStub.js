"use strict";

 // Stub für den SympaClient, der nicht gegen den SOAP Server geht
module.exports = {
  getAllAvailableLists: function (callback) {

    var item =
      [
        'craftsmanswap',
        'neueplattform'
      ];
    callback(null, item);
  },

  getUsersOfList: function (list, callback) {
    callback(null, ['test@me.de', 'michael@schumacher.de', 'michael@ballack.de', 'james@hetfield.com']);
  },

  addUserToList: function (user, list, callback) {
    callback(null, true);
  },

  removeUserFromList: function (user, list, callback) {
    callback(null, true);
  },

  getSubscribedListsForUser: function (userEmail, callback) {
    callback(null, [
      'craftsmanswap',
      'neueplattform'
    ]);
  },

  createList: function (groupId, emailPrefix, callback) {
    callback(null);
  }
};
