'use strict';

var _ = require('lodash');
var beans = require('nconf').get('beans');

var persistence = beans.get('sympaPersistence');


// Mock for the SympaClient with underlying database and proper behavior
module.exports = {
  getAllAvailableLists: function (callback) {
    persistence.list({id: 1}, function (err, lists) {
      if (err || !lists) {return callback(err); }
      callback(null, _.pluck(lists, 'id'));
    });

//    callback(null, lists);
  },

  getUsersOfList: function (listName, callback) {
    persistence.getById(listName, function (err, list) {
      if (err || !list) {return callback(err); }
      callback(null, list.users);
    });

//    callback(null, ['test@me.de', 'michael@schumacher.de', 'michael@ballack.de', 'james@hetfield.com']);
  },

  addUserToList: function (user, listName, callback) {
    persistence.getById(listName, function (err, list) {
      if (err || !list) {return callback(err); }
      list.users.push(user);
      persistence.save(list, function (err) {
        callback(err, true);
      });
    });

//    callback(null, true);
  },

  removeUserFromList: function (user, listName, callback) {
    persistence.getById(listName, function (err, list) {
      if (err || !list) {return callback(err); }
      _.remove(list.users, function (entry) { return entry.trim() === user.trim(); });
      persistence.save(list, function (err) {
        callback(err, true);
      });
    });

//    callback(null, true);
  },

  getSubscribedListsForUser: function (userEmail, callback) {
    persistence.list({id: 1}, function (err, lists) {
      if (err) {return callback(err); }

      var subscribed = _.filter(lists, function (list) { return _.some(list.users, function (user) {return user === userEmail; }); });

      callback(null, _.pluck(subscribed, 'id'));
    });

//    callback(null, lists);
  },

  createList: function (listName, emailPrefix, callback) {
    persistence.save({id: listName, users: []}, function (err) {
      callback(err);
    });

//    callback(null);
  }
};
