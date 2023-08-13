const conf = require("simple-configure");
const beans = conf.get("beans");
const membersService = beans.get("membersService");
const memberstore = beans.get("memberstore");
const groupsService = beans.get("groupsService");
const groupstore = beans.get("groupstore");
const misc = beans.get("misc");
const Member = beans.get("member");

async function addGroupsToMember(member) {
  if (!member) {
    return null;
  }
  member.subscribedGroups = await groupsService.getSubscribedGroupsForMember(member);
  return member;
}

module.exports = {
  getMemberWithHisGroups: async function getMemberWithHisGroups(nickname) {
    const member = await memberstore.getMember(nickname);
    return addGroupsToMember(member);
  },

  removeMember: async function removeMember(nickname) {
    const member = await this.getMemberWithHisGroups(nickname);
    if (!member) {
      return null;
    }
    const unsubFunction = async (group) => {
      group.unsubscribe(member);
      return groupstore.saveGroup(group);
    };
    try {
      await Promise.all(member.subscribedGroups.map(unsubFunction));
      return memberstore.removeMember(member);
    } catch (e) {
      throw new Error("hasSubscriptions");
    }
  },

  getMemberWithHisGroupsByMemberId: async function getMemberWithHisGroupsByMemberId(memberID) {
    const member = await memberstore.getMemberForId(memberID);
    return addGroupsToMember(member);
  },

  getOrganizersOfGroup: async function getOrganizersOfGroup(groupId) {
    const groupIncludingMembers = await this.getGroupAndMembersForList(groupId);
    if (!groupIncludingMembers) {
      return [];
    }
    return groupIncludingMembers.membersThatAreOrganizers(groupIncludingMembers.members);
  },

  getGroupAndMembersForList: async function getGroupAndMembersForList(groupname) {
    const group = await groupstore.getGroup(groupname);
    await this.addMembersToGroup(group);
    return group;
  },

  addMembersToGroup: async function addMembersToGroup(group) {
    if (!group) {
      return null;
    }
    const members = await memberstore.getMembersForIds(group.subscribedMembers);
    await Promise.all(members.map(membersService.putAvatarIntoMemberAndSave));
    group.members = members;
    return group;
  },

  updateAndSaveSubmittedMember: async function updateAndSaveSubmittedMember(
    sessionUser,
    memberformData,
    accessrights,
    notifyNewMemberRegistration,
  ) {
    const persistentMember = await this.getMemberWithHisGroups(memberformData.previousNickname);
    if (persistentMember && !accessrights.canEditMember(persistentMember)) {
      return;
    }
    const member = persistentMember || new Member().initFromSessionUser(sessionUser);
    member.addAuthentication(memberformData.id);
    if (accessrights.isSuperuser()) {
      member.addAuthentication(memberformData.additionalAuthentication);
    }
    member.fillFromUI(memberformData);

    await memberstore.saveMember(member);
    if (!sessionUser.member || sessionUser.member.id() === member.id()) {
      sessionUser.member = member;
      delete sessionUser.profile;
    }

    const subscriptions = misc.toArray(memberformData.newSubscriptions);
    if (!persistentMember) {
      // new member
      notifyNewMemberRegistration(member, subscriptions);
    }
    await groupsService.updateSubscriptions(member, subscriptions);
    return member.nickname();
  },
};
