"use strict";
const conf = require("simple-configure");
const membersService = require("../members/membersService");
const memberstore = require("../members/memberstore");
const groupsService = require("../groups/groupsService");
const groupstore = require("../groups/groupstore");
const misc = require("../commons/misc");
const Member = require("../members/member");

function addGroupsToMember(member) {
  if (!member) {
    return null;
  }
  member.subscribedGroups = groupsService.getSubscribedGroupsForMember(member);
  return member;
}

module.exports = {
  getMemberWithHisGroups: function getMemberWithHisGroups(nickname) {
    const member = memberstore.getMember(nickname);
    return addGroupsToMember(member);
  },

  removeMember: function removeMember(nickname) {
    const member = this.getMemberWithHisGroups(nickname);
    if (!member) {
      return null;
    }
    const unsubFunction = (group) => {
      group.unsubscribe(member);
      return groupstore.saveGroup(group);
    };
    try {
      member.subscribedGroups.map(unsubFunction);
      return memberstore.removeMember(member);
    } catch (e) {
      throw new Error("hasSubscriptions");
    }
  },

  getMemberWithHisGroupsByMemberId: function getMemberWithHisGroupsByMemberId(memberID) {
    const member = memberstore.getMemberForId(memberID);
    return addGroupsToMember(member);
  },

  getOrganizersOfGroup: function getOrganizersOfGroup(groupId) {
    const groupIncludingMembers = this.getGroupAndMembersForList(groupId);
    if (!groupIncludingMembers) {
      return [];
    }
    return groupIncludingMembers.membersThatAreOrganizers(groupIncludingMembers.members);
  },

  getGroupAndMembersForList: function getGroupAndMembersForList(groupname) {
    const group = groupstore.getGroup(groupname);
    this.addMembersToGroup(group);
    return group;
  },

  getGroupAndMembersForListWithAvatar: async function getGroupAndMembersForListWithAvatar(groupname) {
    const group = groupstore.getGroup(groupname);
    await this.addMembersToGroupWithAvatar(group);
    return group;
  },

  addMembersToGroup: function addMembersToGroup(group) {
    if (!group) {
      return;
    }
    group.members = memberstore.getMembersForIds(group.subscribedMembers);
  },

  addMembersToGroupWithAvatar: async function addMembersToGroupWithAvatar(group) {
    if (!group) {
      return;
    }
    const members = memberstore.getMembersForIds(group.subscribedMembers);
    await Promise.all(members.map(membersService.putAvatarIntoMemberAndSave));
    group.members = members;
  },

  updateAndSaveSubmittedMember: function updateAndSaveSubmittedMember(
    sessionUser,
    memberformData,
    accessrights,
    notifyNewMemberRegistration,
  ) {
    const persistentMember = this.getMemberWithHisGroups(memberformData.previousNickname);
    if (persistentMember && !accessrights.canEditMember(persistentMember)) {
      return;
    }
    const member = persistentMember || new Member().initFromSessionUser(sessionUser);
    member.addAuthentication(memberformData.id);
    if (accessrights.isSuperuser()) {
      member.addAuthentication(memberformData.additionalAuthentication);
    }
    member.fillFromUI(memberformData);

    memberstore.saveMember(member);
    if (!sessionUser.member || sessionUser.member.id() === member.id()) {
      sessionUser.member = member;
      delete sessionUser.profile;
    }

    const subscriptions = misc.toArray(memberformData.newSubscriptions);
    if (!persistentMember) {
      // new member
      notifyNewMemberRegistration(member, subscriptions);
    }
    groupsService.updateSubscriptions(member, subscriptions);
    return member.nickname();
  },
};
