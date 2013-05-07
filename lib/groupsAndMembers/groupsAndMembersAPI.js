"use strict";

var conf = require('nconf');
var async = require('async');
var membersAPI = conf.get('beans').get('membersAPI');
var groupsAPI = conf.get('beans').get('groupsAPI');

var getUsersOfList = function (listname, globalCallback) {
  async.waterfall([
    function (callback) {
      groupsAPI.getSympaUsersOfList(listname, callback);
    }
  ],
    function (err, sympaUsers) {
      membersAPI.getMembersForEMails(sympaUsers, globalCallback);
    });
};

var getUserWithHisGroupsByUser = function (member, callback) {
  if (member) {
    groupsAPI.getSubscribedGroupsForUser(member.email, callback);
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

module.exports = {
  getUserWithHisGroups: function (nickname, callback) {
    membersAPI.getMember(nickname, async.apply(groupLoader, callback));
  },

  getUserWithHisGroupsById: function (nickname, callback) {
    membersAPI.getMemberForId(nickname, async.apply(groupLoader, callback));
  },

  getUserWithHisGroupsByUser: getUserWithHisGroupsByUser,

  getUsersOfList: getUsersOfList,

  getGroupAndUsersOfList: function (listname, globalCallback) {
    async.parallel([
      function (callback) {
        groupsAPI.getGroup(listname, callback);
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

