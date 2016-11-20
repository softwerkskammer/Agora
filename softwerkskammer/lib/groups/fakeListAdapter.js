'use strict';

const R = require('ramda');
const beans = require('simple-configure').get('beans');

const persistence = beans.get('mailinglistPersistence');


// Mock for the groupsService with underlying database and proper behavior
module.exports = {
  getAllAvailableLists: function getAllAvailableLists(callback) {
    persistence.list({id: 1}, (err, lists) => {
      if (err || !lists) { return callback(err); }
      callback(null, lists.map(list => list.id));
    });
  },

  getUsersOfList: function getUsersOfList(listName, callback) {
    persistence.getById(listName, (err, list) => {
      if (err || !list) { return callback(err); }
      callback(null, list.users);
    });
  },

  addUserToList: function addUserToList(user, listName, callback) {
    persistence.getById(listName, (err, list) => {
      if (err || !list) { return callback(err); }
      list.users.push(user);
      persistence.save(list, err1 => callback(err1, true));
    });
  },

  removeUserFromList: function removeUserFromList(user, listName, callback) {
    persistence.getById(listName, (err, list) => {
      if (err || !list || !list.users) { return callback(err); }
      list.users = R.reject(entry => entry.trim() === user.trim(), list.users);
      persistence.save(list, err1 => callback(err1, true));
    });
  },

  getSubscribedListsForUser: function getSubscribedListsForUser(userEmail, callback) {
    persistence.list({id: 1}, (err, lists) => callback(err, (lists || []).filter(list => list.users.some(user => user === userEmail)).map(each => each.id)));
  },

  createList: function createList(listName, emailPrefix, callback) {
    persistence.save({id: listName, users: []}, function (err) {
      callback(err);
    });
  }
};
