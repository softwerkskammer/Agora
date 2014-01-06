"use strict";

var conf = require('nconf');
var beans = conf.get('beans');
var async = require('async');
var membersAPI = beans.get('membersAPI');
var groupsAPI = beans.get('groupsAPI');
var Group = beans.get('group');
var winston = require('winston');
var logger = winston.loggers.get('sympa');
var misc = beans.get('misc');
var _ = require('lodash');

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
      if (err) { return globalCallback(err); }
      var missingEmails = misc.differenceCaseInsensitive(results.sympaUsers, _.map(results.allMembers, function (member) {return member.email(); }));
      if (missingEmails.length > 0) {
        logger.warn('In list "' + listname + '", these email addresses are superfluous: ' + missingEmails);
      }
      membersAPI.getMembersForEMails(results.sympaUsers, globalCallback);
    });
};

var getUserWithHisGroupsByUser = function (member, callback) {
  if (!member) { return callback(null); }
  groupsAPI.getSubscribedGroupsForUser(member.email(), callback);
};

var addMembersToGroup = function (group, callback) {
  if (!group) { return callback(null); }
  getUsersOfList(group.id, function (err, members) {
    group.members = members;
    group.membercount = members.length;
    return callback(err, group);
  });
};

module.exports = {
  getUserWithHisGroups: function (nickname, callback) {
    membersAPI.getMember(nickname, function (err, member) {
      if (err) { return callback(err); }
      getUserWithHisGroupsByUser(member, function (err, subscribedGroups) {
        if (err) { return callback(err); }
        if (member) {
          member.subscribedGroups = subscribedGroups;
        }
        callback(err, member);
      });
    });
  },

  getMemberWithHisGroupsByMemberId: function (memberID, callback) {
    membersAPI.getMemberForId(memberID, function (err, member) {
      if (err) { return callback(err); }
      getUserWithHisGroupsByUser(member, function (err, subscribedGroups) {
        if (err) { return callback(err); }
        if (member) {
          member.subscribedGroups = subscribedGroups;
        }
        callback(err, member);
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

  addMembercountToGroup: function (group, callback) {
    if (!group) { return callback(null); }
    groupsAPI.getSympaUsersOfList(group.id, function (err, sympaUsers) {
      group.membercount = sympaUsers.length;
      return callback(err, group);
    });
  },

  userIsInMemberList: function (id, users) {
    return users.filter(function (user) { return user.id() === id; }).length > 0;
  },

  updateAdminlistSubscriptions: function (memberID, callback) {
    this.getMemberWithHisGroupsByMemberId(memberID, function (err, member) {
      var adminListName = conf.get('adminListName');
      groupsAPI.getSympaUsersOfList(adminListName, function (err, emailAddresses) {
        var isInAdminList = _.contains(emailAddresses, member.email());
        if (member.isContactperson() && !isInAdminList) {
          return groupsAPI.addUserToList(member.email(), adminListName, callback);
        }
        if (!member.isContactperson() && isInAdminList) {
          return groupsAPI.removeUserFromList(member.email(), adminListName, callback);
        }
        callback();
      });
    });
  },

  saveGroup: function (newGroup, callback) {
    var self = this;
    groupsAPI.createOrSaveGroup(newGroup, function (err, existingGroup) {
      if (err) { return callback(err); }
      async.each(Group.organizersOnlyInOneOf(newGroup, existingGroup), function (memberID, callback) {
        self.updateAdminlistSubscriptions(memberID, callback);
      });
      callback();
    });
  },

  updateSubscriptions: function (member, oldEmail, subscriptions, callback) {
    var self = this;
    return groupsAPI.updateSubscriptions(member.email(), oldEmail, subscriptions, function (err) {
      if (err) { return callback(err); }
      self.updateAdminlistSubscriptions(member.id(), callback);
    });
  }


};

