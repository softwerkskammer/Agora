'use strict';

const async = require('async');
const conf = require('simple-configure');
const ezmlm = require('ezmlm-node')(conf.get('fullyQualifiedHomeDir'), conf.get('emaildomainname'), conf.get('listownerAddress'), conf.get('ezmlmrc'));

module.exports = {

  createList: function createList(list, prefix, callback) {
    ezmlm.createListNamed(list, ezmlm.defaultOptions, prefix, err => {
      if (err) { return callback(err); }
      ezmlm.replyToList(list, callback);
    });
  },

  getAllAvailableLists: function getAllAvailableLists(callback) {
    ezmlm.allLists(callback);
  },

  getSubscribedListsForUser: function getSubscribedListsForUser(user, callback) {
    ezmlm.allLists((err, alle) => {
      if (err) { return callback(err); }
      async.filterSeries(alle, (listname, innerCallback) => {
        ezmlm.usersOfList(listname, (err1, users) => {
          if (err1) { return callback(err1); }
          innerCallback(null, users.includes(user.toLowerCase()));
        });
      }, callback);
    });
  },

  getUsersOfList: function getUsersOfList(list, callback) {
    ezmlm.usersOfList(list, callback);
  },

  addUserToList: function addUserToList(email, list, callback) {
    ezmlm.subscribeUserToList(email.toLowerCase(), list, callback);
  },

  removeUserFromList: function removeUserFromList(email, list, callback) {
    ezmlm.unsubscribeUserFromList(email.toLowerCase(), list, callback);
  },

  archivedMails: function archivedMails(list, maxAgeInDays, callback) {
    ezmlm.archivedMails(list, maxAgeInDays, callback);
  }
};
