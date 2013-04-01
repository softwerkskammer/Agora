"use strict";

module.exports = function (conf) {

  var members = require('../members/membersAPI')(conf);
  var groups = require('../groups/groupsAPI')(conf);
  var async = require('async');

  var getUsersForMailaddresses = function (userAddresses, globalCallback) {
    // TODO!
    globalCallback(null, []);
  };


  var getUsersOfList = function (listname, globalCallback) {
    async.waterfall([
      function (callback) {
        groups.getSympaUsersOfList(listname, callback);
      }
    ],
      function (err, userAddresses) {
        getUsersForMailaddresses(userAddresses, globalCallback);
      });
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

    getUsersOfList: getUsersOfList,

    getGroupAndUsersOfList: function (listname, globalCallback) {
      async.parallel([
        function (callback) {
          groups.getGroup(listname, callback);
        },
        function (callback) {
          getUsersOfList(listname, callback);
        }
      ],
        function (err, results) {
          globalCallback(err, results[0], results[1]);
        }
      );
    }
  };
};

