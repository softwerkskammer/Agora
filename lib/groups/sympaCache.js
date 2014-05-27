'use strict';

var _ = require('lodash');
var conf = require('nconf');

module.exports = function (sympaClient) {

  var realClient = sympaClient;

  return {
    usersOfList: {},
    availableLists: undefined,
    subscribedListsOfUser: {},

    getAllAvailableLists: function (callback) {
      var self = this;
      if (self.availableLists) {
        return callback(null, self.availableLists);
      }
      realClient.getAllAvailableLists(function (err, lists) {
        self.availableLists = lists;
        callback(err, lists);
      });
    },

    getUsersOfList: function (list, callback) {
      var self = this;
      if (self.usersOfList[list]) {
        return callback(null, self.usersOfList[list]);
      }
      realClient.getUsersOfList(list, function (err, users) {
        self.usersOfList[list] = users;
        callback(err, users);
      });
    },

    addUserToList: function (user, list, callback) {
      this.usersOfList[list] = null;
      this.subscribedListsOfUser[user] = null;
      realClient.addUserToList(user, list, callback);
    },

    removeUserFromList: function (user, list, callback) {
      this.usersOfList[list] = null;
      this.subscribedListsOfUser[user] = null;
      realClient.removeUserFromList(user, list, callback);
    },

    getSubscribedListsForUser: function (userEmail, callback) {
      var self = this;
      if (self.subscribedListsOfUser[userEmail]) {
        return callback(null, self.subscribedListsOfUser[userEmail]);
      }
      realClient.getSubscribedListsForUser(userEmail, function (err, lists) {
        lists = _.without(lists, conf.get('adminListName'));
        self.subscribedListsOfUser[userEmail] = lists;
        callback(null, lists);
      });
    },

    createList: function (groupId, emailPrefix, callback) {
      this.availableLists = undefined;
      realClient.createList(groupId, emailPrefix, callback);
    }
  };
};
