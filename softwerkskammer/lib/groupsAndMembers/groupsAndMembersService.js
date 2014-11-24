'use strict';

var async = require('async');
var winston = require('winston');
var logger = winston.loggers.get('sympa');
var _ = require('lodash');

var conf = require('nconf');
var beans = conf.get('beans');
var membersService = beans.get('membersService');
var memberstore = beans.get('memberstore');
var groupsService = beans.get('groupsService');
var groupstore = beans.get('groupstore');
var Group = beans.get('group');
var misc = beans.get('misc');
var Member = beans.get('member');

var getUsersOfList = function (listname, globalCallback) {
  async.parallel(
    {
      sympaUsers: function (callback) {
        groupsService.getSympaUsersOfList(listname, callback);
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
  groupsService.getSubscribedGroupsForUser(member.email(), callback);
};

var addMembersToGroup = function (group, callback) {
  if (!group) { return callback(null); }
  getUsersOfList(group.id, function (err, members) {
    async.each(members, membersService.getImage, function () {
      group.members = members;
      group.membercount = members.length;
      callback(err, group);
    });
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
          groupstore.getGroup(groupname, callback);
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
    groupsService.getSympaUsersOfList(group.id, function (err, sympaUsers) {
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
      groupsService.getSympaUsersOfList(adminListName, function (err, emailAddresses) {
        var isInAdminList = _.contains(emailAddresses, member.email());
        if (member.isContactperson() && !isInAdminList) {
          return groupsService.addUserToList(member.email(), adminListName, callback);
        }
        if (!member.isContactperson() && isInAdminList) {
          return groupsService.removeUserFromList(member.email(), adminListName, callback);
        }
        callback();
      });
    });
  },

  saveGroup: function (newGroup, callback) {
    var self = this;
    groupsService.createOrSaveGroup(newGroup, function (err, existingGroup) {
      if (err) { return callback(err); }
      async.each(Group.organizersOnlyInOneOf(newGroup, existingGroup), function (memberID, callback) {
        self.updateAdminlistSubscriptions(memberID, callback);
      });
      callback();
    });
  },

  updateSubscriptions: function (member, oldEmail, subscriptions, callback) {
    var self = this;
    return groupsService.updateSubscriptions(member.email(), oldEmail, subscriptions, function (err) {
      if (err) { return callback(err); }
      self.updateAdminlistSubscriptions(member.id(), callback);
    });
  },

  subscribeMemberToGroup: function (member, groupname, callback) {
    var self = this;
    groupsService.addUserToList(member.email(), groupname, function (err) {
      if (err) { return callback(err); }
      self.updateAdminlistSubscriptions(member.id(), callback);
    });
  },

  unsubscribeMemberFromGroup: function (member, groupname, callback) {
    var self = this;
    groupsService.removeUserFromList(member.email(), groupname, function (err) {
      if (err) { return callback(err); }
      self.updateAdminlistSubscriptions(member.id(), callback);
    });
  },

  updateAndSaveSubmittedMember: function (sessionUser, memberformData, accessrights, notifyNewMemberRegistration, callback) {
    var self = this;
    self.getUserWithHisGroups(memberformData.previousNickname, function (err, persistentMember) {
      if (err) { return callback(err); }
      if (persistentMember && !accessrights.canEditMember(persistentMember)) {
        return callback(null);
      }
      var member = persistentMember || new Member().initFromSessionUser(sessionUser);
      var oldEmail = persistentMember ? member.email() : memberformData.previousEmail;
      member.addAuthentication(memberformData.id);
      member.fillFromUI(memberformData);
      memberstore.saveMember(member, function (err) {
        if (err) { return callback(err); }
        if (!sessionUser.member || sessionUser.member.id() === member.id()) {
          sessionUser.member = member;
          delete sessionUser.profile;
        }
        var subscriptions = misc.toArray(memberformData.newSubscriptions);
        if (!persistentMember) { // new member
          notifyNewMemberRegistration(member, subscriptions);
        }
        return self.updateSubscriptions(member, oldEmail, subscriptions, function (err) {
          return callback(err, member.nickname());
        });
      });
    });
  }

};

