const R = require("ramda");
const conf = require("simple-configure");

const beans = conf.get("beans");
const validation = beans.get("validation");
const groupstore = beans.get("groupstore");
const misc = beans.get("misc");

function isReserved(groupname) {
  return new RegExp("^edit$|^new$|^checkgroupname$|^submit$|^administration$|[^\\w-]", "i").test(groupname);
}

module.exports = {
  // API geändert von email() auf member und Methode umbenannt
  getSubscribedGroupsForMember: async function getSubscribedGroupsForMember(member) {
    const groups = await groupstore.allGroups();
    return groups.filter((g) => g.subscribedMembers.includes(member.id()));
  },

  allGroupColors: async function allGroupColors() {
    const groups = await groupstore.allGroups();
    return (groups || []).reduce((result, group) => {
      result[group.id] = group.color;
      return result;
    }, {});
  },

  isGroupValid: async function isGroupValid(group) {
    const errors = validation.isValidGroup(group);
    try {
      const existingGroup = await groupstore.getGroup(group.id);
      if (existingGroup) {
        return errors;
      }
    } catch (e) {
      errors.push("Technical error validating the group.");
    }
    const self = this;
    const result = await self.isGroupNameAvailable(group.id);
    if (!result) {
      errors.push("Dieser Gruppenname ist bereits vergeben.");
    }
    try {
      const result1 = await self.isEmailPrefixAvailable(group.emailPrefix);
      if (!result1) {
        errors.push("Dieses Präfix ist bereits vergeben.");
      }
    } catch (e) {
      errors.push("Technical error validating email prefix.");
    }
    return errors;
  },

  // API change email() -> member and renamed
  addMemberToGroupNamed: async function addMemberToGroupNamed(member, groupname) {
    const group = await groupstore.getGroup(groupname);
    group.subscribe(member);
    return groupstore.saveGroup(group);
  },

  // API change email() -> member and renamed
  removeMemberFromGroupNamed: async function removeMemberFromGroupNamed(member, groupname) {
    const group = await groupstore.getGroup(groupname);
    group.unsubscribe(member);
    return groupstore.saveGroup(group);
  },

  // API change: email() -> member, oldUserMail removed
  updateSubscriptions: async function updateSubscriptions(member, newSubscriptions) {
    const groups = groupstore.allGroups();
    const subscribedGroups = groups.filter((g) => g.subscribedMembers.includes(member.id()));
    const groupsForNewSubscriptions = groups.filter((g) => misc.toArray(newSubscriptions).includes(g.id));

    const groupsToSubscribe = R.difference(groupsForNewSubscriptions, subscribedGroups);
    const groupsToUnsubscribe = R.difference(subscribedGroups, groupsForNewSubscriptions);

    groupsToSubscribe.forEach((g) => g.subscribe(member));
    groupsToUnsubscribe.forEach((g) => g.unsubscribe(member));

    return Promise.all(groupsToSubscribe.concat(groupsToUnsubscribe).map(groupstore.saveGroup));
  },

  markGroupsSelected: function markGroupsSelected(groupsToMark, availableGroups) {
    return availableGroups.map((group) => ({ group, selected: groupsToMark.some((subG) => subG.id === group.id) }));
  },

  isGroupNameAvailable: async function isGroupNameAvailable(groupname) {
    const trimmedGroupname = groupname.trim();
    if (isReserved(trimmedGroupname)) {
      return false;
    }
    const group = await groupstore.getGroup(trimmedGroupname);
    return group === null;
  },

  isEmailPrefixAvailable: async function isEmailPrefixAvailable(prefix) {
    if (!prefix) {
      return false;
    }
    const group = await groupstore.getGroupForPrefix(prefix.trim());
    return group === null;
  },

  getGroups: async function getGroups(groupnames) {
    return groupstore.groupsByLists(misc.toArray(groupnames));
  },

  isReserved,
};
