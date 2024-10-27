"use strict";
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
  getSubscribedGroupsForMember: function getSubscribedGroupsForMember(member) {
    const groups = groupstore.allGroups();
    return groups.filter((g) => g.subscribedMembers.includes(member.id()));
  },

  allGroupColors: function allGroupColors() {
    const groups = groupstore.allGroups();
    return (groups || []).reduce((result, group) => {
      result[group.id] = group.color;
      return result;
    }, {});
  },

  isGroupValid: function isGroupValid(group) {
    const errors = validation.isValidGroup(group);
    try {
      const existingGroup = groupstore.getGroup(group.id);
      if (existingGroup) {
        return errors;
      }
    } catch (e) {
      errors.push("Technical error validating the group.");
    }
    const self = this;
    const result = self.isGroupNameAvailable(group.id);
    if (!result) {
      errors.push("Dieser Gruppenname ist bereits vergeben.");
    }
    try {
      const result1 = self.isEmailPrefixAvailable(group.emailPrefix);
      if (!result1) {
        errors.push("Dieses Präfix ist bereits vergeben.");
      }
    } catch (e) {
      errors.push("Technical error validating email prefix.");
    }
    return errors;
  },

  // API change email() -> member and renamed
  addMemberToGroupNamed: function addMemberToGroupNamed(member, groupname) {
    const group = groupstore.getGroup(groupname);
    group.subscribe(member);
    return groupstore.saveGroup(group);
  },

  // API change email() -> member and renamed
  removeMemberFromGroupNamed: function removeMemberFromGroupNamed(member, groupname) {
    const group = groupstore.getGroup(groupname);
    group.unsubscribe(member);
    return groupstore.saveGroup(group);
  },

  // API change: email() -> member, oldUserMail removed
  updateSubscriptions: function updateSubscriptions(member, newSubscriptions) {
    const groups = groupstore.allGroups();
    const subscribedGroups = groups.filter((g) => g.subscribedMembers.includes(member.id()));
    const groupsForNewSubscriptions = groups.filter((g) => misc.toArray(newSubscriptions).includes(g.id));

    const groupsToSubscribe = R.difference(groupsForNewSubscriptions, subscribedGroups);
    const groupsToUnsubscribe = R.difference(subscribedGroups, groupsForNewSubscriptions);

    groupsToSubscribe.forEach((g) => g.subscribe(member));
    groupsToUnsubscribe.forEach((g) => g.unsubscribe(member));

    return groupsToSubscribe.concat(groupsToUnsubscribe).map(groupstore.saveGroup);
  },

  markGroupsSelected: function markGroupsSelected(groupsToMark, availableGroups) {
    return availableGroups.map((group) => ({ group, selected: groupsToMark.some((subG) => subG.id === group.id) }));
  },

  isGroupNameAvailable: function isGroupNameAvailable(groupname) {
    const trimmedGroupname = groupname.trim();
    if (isReserved(trimmedGroupname)) {
      return false;
    }
    const group = groupstore.getGroup(trimmedGroupname);
    return group === null;
  },

  isEmailPrefixAvailable: function isEmailPrefixAvailable(prefix) {
    if (!prefix) {
      return false;
    }
    const group = groupstore.getGroupForPrefix(prefix.trim());
    return group === null;
  },

  getGroups: function getGroups(groupnames) {
    return groupstore.groupsByLists(misc.toArray(groupnames));
  },

  isReserved,
};
