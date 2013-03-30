"use strict";

module.exports = function (conf) {

  var sympaClient = require('./sympa')(conf);
  var groupstore = require('../groups/groupstore')(conf);
  var async = require('async');

  return {
    getSubscribedListsForUser: function (email, globalCallback) {
      async.waterfall([
        function (callback) {
          sympaClient.getSubscribedListsForUser(email, callback);
        }
      ],
        function (err, subscribedLists) {
          var iterator = function (list, callback) {
            groupstore.getGroup(list.listAddress, callback);
          };
          async.map(subscribedLists, iterator, globalCallback);
        });
    }
  };
};

