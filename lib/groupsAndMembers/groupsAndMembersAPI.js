"use strict";

var beans = require('nconf').get('beans');
var async = require('async');
var membersAPI = beans.get('membersAPI');
var groupsAPI = beans.get('groupsAPI');
var winston = require('winston');
var logger = winston.loggers.get('sympa');
var misc = beans.get('misc');
var _ = require('underscore');

var getUsersOfList = function (listname, globalCallback) {
  async.parallel({
      sympaUsers: function (callback) {
        groupsAPI.getSympaUsersOfList(listname, callback);
      },
      allMembers: function (callback) {
        membersAPI.allMembers(callback);
      }
    },
    function (err, results) {
      var missingEmails = misc.differenceCaseInsensitive(results.sympaUsers, _.pluck(results.allMembers, 'email'));
      if (missingEmails.length > 0) {
        logger.warn('In list "' + listname + '", these email addresses are superfluous: ' + missingEmails);
      }
      membersAPI.getMembersForEMails(results.sympaUsers, globalCallback);
    });
};

var getUserWithHisGroupsByUser = function (member, callback) {
  if (!member) { return callback(null); }
  groupsAPI.getSubscribedGroupsForUser(member.email, callback);
};

var addMembersToGroup = function (group, callback) {
  if (!group) { return callback(null); }
  getUsersOfList(group.id, function (err, members) {
    group.members = members;
    return callback(err, group);
  });
};

module.exports = {
  getUserWithHisGroups: function (nickname, callback) {
    membersAPI.getMember(nickname, function (err, member) {
      if (err || !member) { return callback(err); }
      getUserWithHisGroupsByUser(member, function (err, subscribedGroups) {
        if (err) { return callback(err); }
        callback(err, member, subscribedGroups);
      });
    });
  },

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

