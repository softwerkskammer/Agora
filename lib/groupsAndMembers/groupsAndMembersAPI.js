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

  var getUserWithHisGroupsByUser = function (member, callback) {
    if (member) {
      groups.getSubscribedGroupsForUser(member.email, callback);
    } else {
      callback(null, null, []);
    }
  };

  return {
    getUserWithHisGroups: function (nickname, globalCallback) {
      async.waterfall([
        function (callback) {
          members.getMember(nickname, callback);
        },
        function (member, callback) {
          if (member) {
            getUserWithHisGroupsByUser(member, async.apply(callback, member));
          } else {
            callback(null, null, []);
          }
        }
      ],
        // callback for results of last function
        function (member, err, subscribedLists) {
          globalCallback(err, member, subscribedLists);
        });
    },

    getUserWithHisGroupsById: function (userid, globalCallback) {
      async.waterfall([
        function (callback) {
          members.getMemberForId(userid, callback);
        },
        function (member, callback) {
          if (member) {
            getUserWithHisGroupsByUser(member, async.apply(callback, member));
          } else {
            callback(null, null, []);
          }
        }
      ],
        // callback for results of last function
        function (member, err, subscribedLists) {
          globalCallback(err, member, subscribedLists);
        });
    },

    getUserWithHisGroupsByUser: getUserWithHisGroupsByUser,

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
    },

    userIsInMemberList: function (id, users) {
      return users.map(function (user) { return user.id === id; }).filter(function (bool) { return bool; }).length > 0;
    }


  };
};

