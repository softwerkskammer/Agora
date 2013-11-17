"use strict";

var lists = ['craftsmanswap', 'neueplattform', 'internet', 'alle', 'commercial'];

// Stub fuer den SympaClient, der nicht gegen den SOAP Server geht
module.exports = {
  getAllAvailableLists: function (callback) {
    callback(null, lists);
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
    callback(null, lists);
  },

  createList: function (groupId, emailPrefix, callback) {
    callback(null);
  }
};
