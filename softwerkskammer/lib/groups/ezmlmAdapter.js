'use strict';

var _ = require('lodash');
var async = require('async');
var conf = require('simple-configure');
var ezmlm = require('ezmlm-node')(conf.get('ezmlmHomedir'), conf.get('emaildomainname'), conf.get('listownerAddress'), conf.get('ezmlmrc'));

module.exports = {

  createList: function (list, prefix, callback) {
    ezmlm.createListNamed(list, ezmlm.defaultOptions, prefix, callback);
  },

  getAllAvailableLists: function (callback) {
    ezmlm.allLists(callback);
  },

  getSubscribedListsForUser: function (user, callback) {
    ezmlm.allLists(function (err, alle) {
      if (err) { return callback(err); }
      async.filter(alle, function (listname, innerCallback) {
        ezmlm.usersOfList(listname, function (err, users) {
          innerCallback(_.contains(users, user));
        });
      }, function (result) { callback(null, result); });
    });
  },

  getUsersOfList: function (list, callback) {
    ezmlm.usersOfList(list, callback);
  },

  addUserToList: function (email, list, callback) {
    ezmlm.subscribeUserToList(email, list, callback);
  },

  removeUserFromList: function (email, list, callback) {
    ezmlm.unsubscribeUserFromList(email, list, callback);
  }

};
