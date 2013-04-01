"use strict";

module.exports = function (conf) {

  var members = require('../members/internalAPI')(conf);
  var groups = require('../groups/groupsAPI')(conf);
  var async = require('async');

  var getUsersForMailaddresses = function (userAddresses, globalCallback) {
    // TODO!
    globalCallback(null, []);
  };

  return {
    getUserWithHisGroups: function (nickname, globalCallback) {
      async.waterfall([
        function (callback) {
          members.getMember(nickname, callback);
        },
        function (member, callback) {
          if (member) {
            groups.getSubscribedGroupsForUser(member.email, async.apply(callback, member));
          } else {
            callback(null, null, []);
          }
        }
      ],
        // callback for results of last function
        function (member, err, subscribedLists) {
          globalCallback(member, subscribedLists);
        });
    },

    getUsersOfList: function (listname, globalCallback) {
      async.waterfall([
        function (callback) {
          groups.getSympaUsersOfList(listname, callback);
        }
      ],
        function (err, userAddresses) {
          getUsersForMailaddresses(userAddresses, globalCallback);
        });
    },

    getGroupAndUsersForList: function (listname, globalCallback) {
      async.parallel([
        function (callback) {
          callback(null, null);
        },
        function (callback) {
          callback(null, []);
        }
      ],
        function (err, results) {
          globalCallback(err, results[0], results[1]);
        }
      );
    }
  };
};

