'use strict';

const async = require('async');
const R = require('ramda');

const conf = require('simple-configure');
const beans = conf.get('beans');
const membersService = beans.get('membersService');
const memberstore = beans.get('memberstore');
const groupsService = beans.get('groupsService');
const groupstore = beans.get('groupstore');
const Group = beans.get('group');
const misc = beans.get('misc');
const Member = beans.get('member');

function membersOfList(listname, callback) {
  groupsService.getMailinglistUsersOfList(listname, (err, emailAddresses) => {
    if (err) { return callback(err); }
    memberstore.getMembersForEMails(emailAddresses, callback);
  });
}

function addMembersToGroup(group, callback) {
  if (!group) { return callback(null); }
  membersOfList(group.id, (err, members) => {
    if (err) { return callback(err); }
    async.each(members, membersService.putAvatarIntoMemberAndSave, err1 => {
      group.members = members;
      group.membercount = members.length;
      callback(err1, group);
    });
  });
}

function addGroupsToMember(member, callback) {
  if (!member) { return callback(null); }
  groupsService.getSubscribedGroupsForUser(member.email(), (err, subscribedGroups) => {
    if (err) { return callback(err); }
    member.subscribedGroups = subscribedGroups;
    callback(err, member);
  });
}

function groupsWithExtraEmailAddresses(members, groupNamesWithEmails) {
  const result = [];
  const allEmailAddresses = members.map(member => member.email().toLowerCase());
  R.keys(groupNamesWithEmails).forEach(name => {
    const diff = R.difference(groupNamesWithEmails[name], allEmailAddresses);
    if (diff.length > 0) { result.push({group: name, extraAddresses: diff}); }
  });
  return result;
}

module.exports = {
  getMemberWithHisGroups: function getMemberWithHisGroups(nickname, callback) {
    memberstore.getMember(nickname, (err, member) => {
      if (err) { return callback(err); }
      addGroupsToMember(member, callback);
    });
  },

  getMemberWithHisGroupsByMemberId: function getMemberWithHisGroupsByMemberId(memberID, callback) {
    memberstore.getMemberForId(memberID, (err, member) => {
      if (err) { return callback(err); }
      addGroupsToMember(member, callback);
    });
  },

  getAllMembersWithTheirGroups: function getAllMembersWithTheirGroups(callback) {
    groupsService.getAllAvailableGroups((err, groups) => {
      if (err) { return callback(err); }

      function loadMembersAndFillInGroups(err1, groupNamesWithEmails, cb) {
        if (err1) { return cb(err1); }

        memberstore.allMembers((err2, members) => {
          if (err2) { return cb(err2); }
          members.forEach(member => member.fillSubscribedGroups(groupNamesWithEmails, groups));
          cb(null, members, groupsWithExtraEmailAddresses(members, groupNamesWithEmails));
        });
      }

      async.reduce(groups, {}, (memo, group, cb) => {
        groupsService.getMailinglistUsersOfList(group.id, (err1, emails) => {
          memo[group.id] = emails;
          cb(err1, memo);
        });
      }, (err1, groupNamesWithEmails) => {
        loadMembersAndFillInGroups(err1, groupNamesWithEmails, callback);
      });
    });
  },

  getGroupAndMembersForList: function getGroupAndMembersForList(groupname, globalCallback) {
    async.waterfall(
      [
        callback => groupstore.getGroup(groupname, callback),
        (group, callback) => addMembersToGroup(group, callback)
      ],
      globalCallback
    );
  },

  addMembersToGroup,

  addMembercountToGroup: function addMembercountToGroup(group, callback) {
    if (!group) { return callback(null); }
    groupsService.getMailinglistUsersOfList(group.id, (err, mailinglistUsers) => {
      group.membercount = mailinglistUsers.length;
      callback(err, group);
    });
  },

  memberIsInMemberList: function memberIsInMemberList(id, members) {
    return members.some(member => member.id() === id);
  },

  updateAdminlistSubscriptions: function updateAdminlistSubscriptions(memberID, callback) {
    this.getMemberWithHisGroupsByMemberId(memberID, (err1, member) => {
      if (err1) { return callback(err1); }
      const adminListName = conf.get('adminListName');
      groupsService.getMailinglistUsersOfList(adminListName, (err2, emailAddresses) => {
        if (err2) { return callback(err2); }
        const isInAdminList = (emailAddresses || []).includes(member.email());
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

  saveGroup: function saveGroup(group, callback) {
    const self = this;
    groupsService.createOrSaveGroup(group, (err, existingGroup) => {
      if (err) { return callback(err); }
      async.each(Group.organizersOnlyInOneOf(group, existingGroup), (memberID, cb) => {
        self.updateAdminlistSubscriptions(memberID, cb);
      });
      callback();
    });
  },

  updateSubscriptions: function updateSubscriptions(member, oldEmail, subscriptions, callback) {
    const self = this;
    groupsService.updateSubscriptions(member.email(), oldEmail, subscriptions, err => {
      if (err) { return callback(err); }
      self.updateAdminlistSubscriptions(member.id(), callback);
    });
  },

  subscribeMemberToGroup: function subscribeMemberToGroup(member, groupname, callback) {
    const self = this;
    groupsService.addUserToList(member.email(), groupname, err => {
      if (err) { return callback(err); }
      self.updateAdminlistSubscriptions(member.id(), callback);
    });
  },

  unsubscribeMemberFromGroup: function unsubscribeMemberFromGroup(member, groupname, callback) {
    const self = this;
    groupsService.removeUserFromList(member.email(), groupname, err => {
      if (err) { return callback(err); }
      self.updateAdminlistSubscriptions(member.id(), callback);
    });
  },

  updateAndSaveSubmittedMemberWithSubscriptions: function updateAndSaveSubmittedMemberWithSubscriptions(sessionUser, memberformData, accessrights, notifyNewMemberRegistration, callback) {
    this.getMemberWithHisGroups(memberformData.previousNickname, (err, persistentMember) => {
      if (err) { return callback(err); }
      if (persistentMember && !accessrights.canEditMember(persistentMember)) {
        return callback(null);
      }
      const member = persistentMember || new Member().initFromSessionUser(sessionUser);
      const oldEmail = persistentMember ? member.email() : memberformData.previousEmail;
      member.addAuthentication(memberformData.id);
      if (accessrights.isSuperuser()) { member.addAuthentication(memberformData.additionalAuthentication); }
      member.fillFromUI(memberformData);
      memberstore.saveMember(member, err1 => {
        if (err1) { return callback(err1); }
        if (!sessionUser.member || sessionUser.member.id() === member.id()) {
          sessionUser.member = member;
          delete sessionUser.profile;
        }

        const subscriptions = misc.toArray(memberformData.newSubscriptions);
        if (!persistentMember) { // new member
          notifyNewMemberRegistration(member, subscriptions);
        }
        return this.updateSubscriptions(member, oldEmail, subscriptions, err2 => callback(err2, member.nickname()));
      });
    });
  }

};

