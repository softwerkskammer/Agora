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

var addMembersToGroup = function (group, callback) {
  if (!group) {
    return callback(null, group);
  }
  return getUsersOfList(group.id, function (err, members) {
    group.members = members;
    return callback(err, group);
  });
};

module.exports = {
  getUserWithHisGroups: function (nickname, callback) {
    membersAPI.getMember(nickname, async.apply(groupLoader, callback));
  },

  getUserWithHisGroupsByUser: getUserWithHisGroupsByUser,

  getUsersOfList: getUsersOfList,

  getGroupAndMembersForList: function (listname, globalCallback) {
    async.waterfall([
      function (callback) {
        groupsAPI.getGroup(listname, callback);
      },
      function (group, callback) {
        addMembersToGroup(group, callback);
      }
    ],
    function (err, group) {
      return globalCallback(err, group);
    });
  },

  addMembersToGroup: addMembersToGroup,

  userIsInMemberList: function (id, users) {
    return users.filter(function (user) { return user.id === id; }).length > 0;
  }
};

