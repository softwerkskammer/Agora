"use strict";

module.exports = function (conf) {

  var members = require('../members/membersAPI')(conf);
  var groups = require('../groups/groupsAPI')(conf);
  var async = require('async');

  var getUsersOfList = function (listname, globalCallback) {
    async.waterfall([
      function (callback) {
        groups.getSympaUsersOfList(listname, callback);
      }
    ],
      function (err, sympaUsers) {
        members.getMembersForEMails(sympaUsers, globalCallback);
      });
  };


  var getUserWithHisGroupsByUser = function (member, callback) {
    if (member) {
      groups.getSubscribedGroupsForUser(member.email, callback);
    } else {
      callback(null, null, []);
    }
  };

  var groupLoader = function (callback, err, member) {
    if (err) {
      return callback(err);
    }
    if (member) {
      return getUserWithHisGroupsByUser(member, function (err, subscribedGroups) {
        callback(err, member, subscribedGroups);
      });
    }
    return callback(new Error('Member not found'), null, []);
  };

  return {
    getUserWithHisGroups: function (nickname, callback) {
      members.getMember(nickname, async.apply(groupLoader, callback));
    },

    getUserWithHisGroupsById: function (nickname, callback) {
      members.getMemberForId(nickname, async.apply(groupLoader, callback));
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
          if (results[0]) {
            return globalCallback(err, results[0], results[1]);
          }
          return globalCallback(err, null, []); // no group -> no users
        }
      );
    },

    userIsInMemberList: function (id, users) {
      return users.map(function (user) { return user.id === id; }).filter(function (bool) { return bool; }).length > 0;
    }


  };
};

