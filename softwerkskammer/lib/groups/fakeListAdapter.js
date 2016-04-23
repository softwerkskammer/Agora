'use strict';

var _ = require('lodash');
var beans = require('simple-configure').get('beans');

var persistence = beans.get('mailinglistPersistence');


// Mock for the groupsService with underlying database and proper behavior
module.exports = {
  getAllAvailableLists: function (callback) {
    persistence.list({id: 1}, function (err, lists) {
      if (err || !lists) {return callback(err); }
      callback(null, _.map(lists, 'id'));
    });
  },

  getUsersOfList: function (listName, callback) {
    persistence.getById(listName, function (err, list) {
      if (err || !list) {return callback(err); }
      callback(null, list.users);
    });
  },

  addUserToList: function (user, listName, callback) {
    persistence.getById(listName, function (err, list) {
      if (err || !list) {return callback(err); }
      list.users.push(user);
      persistence.save(list, function (err1) { callback(err1, true); });
    });
  },

  removeUserFromList: function (user, listName, callback) {
    persistence.getById(listName, function (err, list) {
      if (err || !list) {return callback(err); }
      _.remove(list.users, function (entry) { return entry.trim() === user.trim(); });
      persistence.save(list, function (err1) { callback(err1, true); });
    });
  },

  getSubscribedListsForUser: function (userEmail, callback) {
    persistence.list({id: 1}, function (err, lists) {
      if (err) {return callback(err); }

      var subscribed = _.filter(lists, function (list) { return _.some(list.users, function (user) {return user === userEmail; }); });

      callback(null, _.map(subscribed, 'id'));
    });
  },

  createList: function (listName, emailPrefix, callback) {
    persistence.save({id: listName, users: []}, function (err) {
      callback(err);
    });

//    callback(null);
  }
};
