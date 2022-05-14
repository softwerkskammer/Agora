const async = require("async");

const conf = require("simple-configure");
const beans = conf.get("beans");
const membersService = beans.get("membersService");
const memberstore = beans.get("memberstore");
const groupsService = beans.get("groupsService");
const groupstore = beans.get("groupstore");
const misc = beans.get("misc");
const Member = beans.get("member");

async function addGroupsToMember(member, callback) {
  if (!member) {
    return callback(null);
  }
  // API geändert von email() auf member und Methode umbenannt
  try {
    const subscribedGroups = await groupsService.getSubscribedGroupsForMember(member);
    member.subscribedGroups = subscribedGroups;
    callback(null, member);
  } catch (e) {
    return callback(e);
  }
}

module.exports = {
  getMemberWithHisGroups: async function getMemberWithHisGroups(nickname, callback) {
    try {
      const member = await memberstore.getMember(nickname);
      addGroupsToMember(member, callback);
    } catch (e) {
      callback(e);
    }
  },

  removeMember: function removeMember(nickname, callback) {
    this.getMemberWithHisGroups(nickname, async (err, member) => {
      if (err || !member) {
        return callback(err);
      }

      const unsubFunction = async (group) => {
        group.unsubscribe(member);
        return groupstore.saveGroup(group);
      };

      try {
        await Promise.all(member.subscribedGroups.map(unsubFunction));
        memberstore.removeMember(member);
        callback();
      } catch (e) {
        callback(new Error("hasSubscriptions"));
      }
    });
  },

  getMemberWithHisGroupsByMemberId: async function getMemberWithHisGroupsByMemberId(memberID, callback) {
    try {
      const member = await memberstore.getMemberForId(memberID);
      addGroupsToMember(member, callback);
    } catch (e) {
      callback(e);
    }
  },

  getOrganizersOfGroup: function getOrganizersOfGroup(groupId, callback) {
    this.getGroupAndMembersForList(groupId, (error, groupIncludingMembers) => {
      if (error) {
        return callback(error);
      }
      if (!groupIncludingMembers) {
        return callback(null, []);
      }
      const organizers = groupIncludingMembers.membersThatAreOrganizers(groupIncludingMembers.members);
      callback(null, organizers);
    });
  },

  getGroupAndMembersForList: function getGroupAndMembersForList(groupname, globalCallback) {
    async.waterfall(
      [
        async.asyncify(async () => await groupstore.getGroup(groupname)),
        (group, callback) => this.addMembersToGroup(group, callback),
      ],
      globalCallback
    );
  },

  addMembersToGroup: async function addMembersToGroup(group, callback) {
    if (!group) {
      return callback(null);
    }
    try {
      const members = await memberstore.getMembersForIds(group.subscribedMembers);
      async.each(members, membersService.putAvatarIntoMemberAndSave, (err1) => {
        group.members = members;
        callback(err1, group);
      });
    } catch (e) {
      callback(e);
    }
  },

  updateAndSaveSubmittedMember: function updateAndSaveSubmittedMember(
    sessionUser,
    memberformData,
    accessrights,
    notifyNewMemberRegistration,
    callback
  ) {
    this.getMemberWithHisGroups(memberformData.previousNickname, async (err, persistentMember) => {
      if (err) {
        return callback(err);
      }
      if (persistentMember && !accessrights.canEditMember(persistentMember)) {
        return callback(null);
      }
      const member = persistentMember || new Member().initFromSessionUser(sessionUser);
      member.addAuthentication(memberformData.id);
      if (accessrights.isSuperuser()) {
        member.addAuthentication(memberformData.additionalAuthentication);
      }
      member.fillFromUI(memberformData);

      try {
        await memberstore.saveMember(member);
      } catch (e) {
        return callback(e);
      }
      if (!sessionUser.member || sessionUser.member.id() === member.id()) {
        sessionUser.member = member;
        delete sessionUser.profile;
      }

      const subscriptions = misc.toArray(memberformData.newSubscriptions);
      if (!persistentMember) {
        // new member
        notifyNewMemberRegistration(member, subscriptions);
      }
      // API change: email() -> member, oldEmail removed and also inlined
      try {
        await groupsService.updateSubscriptions(member, subscriptions);
        callback(null, member.nickname());
      } catch (e) {
        callback(e);
      }
    });
  },
};
