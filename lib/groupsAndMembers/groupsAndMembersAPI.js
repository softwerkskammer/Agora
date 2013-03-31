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

    getUsersOfList: function (groupname, globalCallback) {
      async.waterfall([
        function (callback) {
          groups.getSympaUsersOfList(groupname, callback);
        }
      ],
        function (err, userAddresses) {
          getUsersForMailaddresses(userAddresses, globalCallback);
        });
    }
  };
};

