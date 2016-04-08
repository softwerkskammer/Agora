'use strict';

var _ = require('lodash');
var async = require('async');
var conf = require('simple-configure');
var ezmlm = require('ezmlm-node')(conf.get('fullyQualifiedHomeDir'), conf.get('emaildomainname'), conf.get('listownerAddress'), conf.get('ezmlmrc'));

module.exports = {

  createList: function (list, prefix, callback) {
    ezmlm.createListNamed(list, ezmlm.defaultOptions, prefix, function (err) {
      if (err) { return callback(err); }
      ezmlm.replyToList(list, callback);
    });
  },

  getAllAvailableLists: function (callback) {
    ezmlm.allLists(callback);
  },

  getSubscribedListsForUser: function (user, callback) {
    ezmlm.allLists(function (err, alle) {
      if (err) { return callback(err); }
      async.filterSeries(alle, function (listname, innerCallback) {
        ezmlm.usersOfList(listname, function (err1, users) {
          if (err1) { return callback(err1); }
          innerCallback(_.includes(users, user.toLowerCase()));
        });
      }, function (result) { callback(null, result); });
    });
  },

  getUsersOfList: function (list, callback) {
    ezmlm.usersOfList(list, callback);
  },

  addUserToList: function (email, list, callback) {
    ezmlm.subscribeUserToList(email.toLowerCase(), list, callback);
  },

  removeUserFromList: function (email, list, callback) {
    ezmlm.unsubscribeUserFromList(email.toLowerCase(), list, callback);
  },

  archivedMails: function (list, maxAgeInDays, callback) {
    ezmlm.archivedMails(list, maxAgeInDays, callback);
  }
};
