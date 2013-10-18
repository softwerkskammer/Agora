"use strict";

module.exports = function (sympaClient) {

  var realClient = sympaClient;

  return {
    usersOfList: {},
    availableLists: undefined,
    subscribedListsOfUser: {},

    getAllAvailableLists: function (callback) {
      var self = this;
      if (self.availableLists) {
        callback(null, this.availableLists);
        return realClient.getAllAvailableLists(function (err, lists) {
          if (err) { return; }
          self.availableLists = lists;
        });
      }
      realClient.getAllAvailableLists(function (err, lists) {
        self.availableLists = lists;
        callback(err, lists);
      });
    },

    getUsersOfList: function (list, callback) {
      var self = this;
      if (self.usersOfList[list]) {
        callback(null, this.usersOfList[list]);
        return realClient.getUsersOfList(list, function (err, users) {
          if (err) { return; }
          self.usersOfList[list] = users;
        });
      }
      realClient.getUsersOfList(list, function (err, users) {
        self.usersOfList[list] = users;
        callback(err, users);
      });
    },

    addUserToList: function (user, list, callback) {
      this.usersOfList[list] = null;
      realClient.addUserToList(user, list, callback);
    },

    removeUserFromList: function (user, list, callback) {
      this.usersOfList[list] = null;
      realClient.removeUserFromList(user, list, callback);
    },

    getSubscribedListsForUser: function (userEmail, callback) {
      var self = this;
      if (self.subscribedListsOfUser[userEmail]) {
        callback(null, this.subscribedListsOfUser[userEmail]);
        return realClient.getSubscribedListsForUser(userEmail, function (err, lists) {
          if (err) { return; }
          self.subscribedListsOfUser[userEmail] = lists;
        });
      }
      realClient.getSubscribedListsForUser(userEmail, function (err, lists) {
        self.subscribedListsOfUser[userEmail] = lists;
        callback(null, lists);
      });
    },

    createList: function (groupId, emailPrefix, callback) {
      realClient.createList(groupId, emailPrefix, callback);
    }
  };
};
