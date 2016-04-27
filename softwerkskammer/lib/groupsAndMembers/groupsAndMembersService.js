'use strict';

var async = require('async');
var _ = require('lodash');

var conf = require('simple-configure');
var beans = conf.get('beans');
var membersService = beans.get('membersService');
var memberstore = beans.get('memberstore');
var groupsService = beans.get('groupsService');
var groupstore = beans.get('groupstore');
var Group = beans.get('group');
var misc = beans.get('misc');
var Member = beans.get('member');

function membersOfList(listname, callback) {
  groupsService.getMailinglistUsersOfList(listname, function (err, emailAddresses) {
    if (err) { return callback(err); }
    memberstore.getMembersForEMails(emailAddresses, callback);
  });
}

function addMembersToGroup(group, callback) {
  if (!group) { return callback(null); }
  membersOfList(group.id, function (err, members) {
    if (err) { return callback(err); }
    async.each(members, membersService.putAvatarIntoMemberAndSave, function () {
      group.members = members;
      group.membercount = members.length;
      callback(err, group);
    });
  });
}

function addGroupsToMember(member, callback) {
  if (!member) { return callback(null); }
  groupsService.getSubscribedGroupsForUser(member.email(), function (err, subscribedGroups) {
    if (err) { return callback(err); }
    member.subscribedGroups = subscribedGroups;
    callback(err, member);
  });
}

function updateAndSaveSubmittedMember(self, sessionUser, memberformData, accessrights, notifyNewMemberRegistration, updateSubscriptions, callback) {
  self.getMemberWithHisGroups(memberformData.previousNickname, function (err, persistentMember) {
    if (err) { return callback(err); }
    if (persistentMember && !accessrights.canEditMember(persistentMember)) {
      return callback(null);
    }
    var member = persistentMember || new Member().initFromSessionUser(sessionUser);
    var oldEmail = persistentMember ? member.email() : memberformData.previousEmail;
    member.addAuthentication(memberformData.id);
    if (accessrights.isSuperuser()) { member.addAuthentication(memberformData.additionalAuthentication); }
    member.fillFromUI(memberformData);
    member.state.socratesOnly = !updateSubscriptions && !member.location(); // SoCraTes creates members with "false", Softwerkskammer with "true"
    memberstore.saveMember(member, function (err1) {
      if (err1) { return callback(err1); }
      if (!sessionUser.member || sessionUser.member.id() === member.id()) {
        sessionUser.member = member;
        delete sessionUser.profile;
      }

      var subscriptions = misc.toArray(memberformData.newSubscriptions);
      if (!persistentMember) { // new member
        notifyNewMemberRegistration(member, subscriptions);
      }
      if (updateSubscriptions) {
        return self.updateSubscriptions(member, oldEmail, subscriptions, function (err2) {
          return callback(err2, member.nickname());
        });
      }
      return callback(null, member.nickname());
    });
  });
}

function groupsWithExtraEmailAddresses(members, groupNamesWithEmails) {
  var allEmailAddresses = _.map(members, function (member) { return member.email().toLowerCase(); });
  return _.transform(groupNamesWithEmails, function (result, value, key) {
    var diff = _.difference(value, allEmailAddresses);
    if (diff.length > 0) { result.push({group: key, extraAddresses: diff}); }
  }, []);
}

module.exports = {
  getMemberWithHisGroups: function (nickname, callback) {
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

  getAllMembersWithTheirGroups: function (callback) {
    groupsService.getAllAvailableGroups(function (err, groups) {
      if (err) { return callback(err); }

      function loadMembersAndFillInGroups(err1, groupNamesWithEmails, cb) {
        if (err1) { return cb(err1); }

        memberstore.allMembers(function (err2, members) {
          if (err2) { return cb(err2); }
          _.each(members, function (member) { member.fillSubscribedGroups(groupNamesWithEmails, groups); });
          cb(null, members, groupsWithExtraEmailAddresses(members, groupNamesWithEmails));
        });
      }

      async.reduce(groups, {}, function (memo, group, cb) {
        groupsService.getMailinglistUsersOfList(group.id, function (err1, emails) {
          memo[group.id] = emails;
          cb(err1, memo);
        });
      }, function (err1, groupNamesWithEmails) {
        loadMembersAndFillInGroups(err1, groupNamesWithEmails, callback);
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
    groupsService.getMailinglistUsersOfList(group.id, function (err, mailinglistUsers) {
      group.membercount = mailinglistUsers.length;
      return callback(err, group);
    });
  },

  memberIsInMemberList: function (id, members) {
    return _(members).some(function (member) { return member.id() === id; });
  },

  updateAdminlistSubscriptions: function (memberID, callback) {
    this.getMemberWithHisGroupsByMemberId(memberID, function (err1, member) {
      if (err1) { return callback(err1); }
      var adminListName = conf.get('adminListName');
      groupsService.getMailinglistUsersOfList(adminListName, function (err2, emailAddresses) {
        if (err2) { return callback(err2); }
        var isInAdminList = _.includes(emailAddresses, member.email());
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
      async.each(Group.organizersOnlyInOneOf(newGroup, existingGroup), function (memberID, cb) {
        self.updateAdminlistSubscriptions(memberID, cb);
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

  updateAndSaveSubmittedMemberWithoutSubscriptions: function (sessionUser, memberformData, accessrights, notifyNewMemberRegistration, callback) {
    updateAndSaveSubmittedMember(this, sessionUser, memberformData, accessrights, notifyNewMemberRegistration, false, callback);
  },

  updateAndSaveSubmittedMemberWithSubscriptions: function (sessionUser, memberformData, accessrights, notifyNewMemberRegistration, callback) {
    updateAndSaveSubmittedMember(this, sessionUser, memberformData, accessrights, notifyNewMemberRegistration, true, callback);
  }

};

