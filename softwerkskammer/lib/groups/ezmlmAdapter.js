'use strict';

const async = require('async');
const conf = require('simple-configure');
const ezmlm = require('ezmlm-node')(conf.get('fullyQualifiedHomeDir'), conf.get('emaildomainname'), conf.get('listownerAddress'), conf.get('ezmlmrc'));

module.exports = {

  createList: function createList(listname, prefix, callback) {
    ezmlm.createListNamed(listname, ezmlm.defaultOptions, prefix, err => {
      if (err) { return callback(err); }
      ezmlm.replyToList(listname, callback);
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

  getUsersOfList: function getUsersOfList(listname, callback) {
    ezmlm.usersOfList(listname, callback);
  },

  addUserToList: function addUserToList(email, listname, callback) {
    ezmlm.subscribeUserToList(email.toLowerCase(), listname, callback);
  },

  removeUserFromList: function removeUserFromList(email, listname, callback) {
    ezmlm.unsubscribeUserFromList(email.toLowerCase(), listname, callback);
  },

  archivedMails: function archivedMails(listname, maxAgeInDays, callback) {
    ezmlm.archivedMails(listname, maxAgeInDays, callback);
  }
};
