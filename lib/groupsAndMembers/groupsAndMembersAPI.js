'use strict';

var conf = require('nconf');
var beans = conf.get('beans');
var async = require('async');
var memberstore = beans.get('memberstore');
var groupsAPI = beans.get('groupsAPI');
var Group = beans.get('group');
var winston = require('winston');
var logger = winston.loggers.get('sympa');
var misc = beans.get('misc');
var _ = require('lodash');

var getUsersOfList = function (listname, globalCallback) {
  async.parallel(
    {
      sympaUsers: function (callback) {
        groupsAPI.getSympaUsersOfList(listname, callback);
      },
      allMembers: function (callback) {
        memberstore.allMembers(callback);
      }
    },
    function (err, results) {
      if (err) { return globalCallback(err); }
      var missingEmails = misc.differenceCaseInsensitive(results.sympaUsers, _.map(results.allMembers, function (member) {return member.email(); }));
      if (missingEmails.length > 0) {
        logger.warn('In list "' + listname + '", these email addresses are superfluous: ' + missingEmails);
      }
      memberstore.getMembersForEMails(results.sympaUsers, globalCallback);
    }
  );
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

var addGroupsToMember = function (member, callback) {
  getUserWithHisGroupsByUser(member, function (err, subscribedGroups) {
    if (err) { return callback(err); }
    if (member) {
      member.subscribedGroups = subscribedGroups;
    }
    callback(err, member);
  });
};

module.exports = {
  getUserWithHisGroups: function (nickname, callback) {
    memberstore.getMember(nickname, function (err, member) {
      if (err) { return callback(err); }
      addGroupsToMember(member, callback);
    });
  },

  getMemberWithHisGroupsByMemberId: function (memberID, callback) {
    memberstore.getMemberForId(memberID, function (err, member) {
      if (err) { return callback(err); }
      addGroupsToMember(member, callback);
    });
  },

  getAllUsersWithTheirGroups: function (callback) {
    memberstore.allMembers(function (err, members) {
      if (err) { return callback(err); }
      async.each(members, function (member, innerCallback) {
        addGroupsToMember(member, innerCallback);
      }, function (err) {
        if (err) { return callback(err); }
        callback(null, members);
      });
    });
  },

  getGroupAndMembersForList: function (groupname, globalCallback) {
    async.waterfall(
      [
        function (callback) {
          groupsAPI.getGroup(groupname, callback);
        },
        function (group, callback) {
          addMembersToGroup(group, callback);
        }
      ],
      function (err, group) {
        return globalCallback(err, group);
      }
    );
  },

  addMembersToGroup: addMembersToGroup,

  addMembercountToGroup: function (group, callback) {
    if (!group) { return callback(null); }
    groupsAPI.getSympaUsersOfList(group.id, function (err, sympaUsers) {
      group.membercount = sympaUsers.length;
      return callback(err, group);
    });
  },

  memberIsInMemberList: function (id, members) {
    return _(members).some(function (member) { return member.id() === id; });
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
  },

  subscribeMemberToGroup: function (member, groupname, callback) {
    var self = this;
    groupsAPI.addUserToList(member.email(), groupname, function (err) {
      if (err) { return callback(err); }
      self.updateAdminlistSubscriptions(member.id(), callback);
    });
  },

  unsubscribeMemberFromGroup: function (member, groupname, callback) {
    var self = this;
    groupsAPI.removeUserFromList(member.email(), groupname, function (err) {
      if (err) { return callback(err); }
      self.updateAdminlistSubscriptions(member.id(), callback);
    });
  }

};

