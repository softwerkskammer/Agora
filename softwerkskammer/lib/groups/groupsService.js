const R = require("ramda");
const conf = require("simple-configure");
const async = require("async");

const beans = conf.get("beans");
const validation = beans.get("validation");
const groupstore = beans.get("groupstore");
const misc = beans.get("misc");

function isReserved(groupname) {
  return new RegExp("^edit$|^new$|^checkgroupname$|^submit$|^administration$|[^\\w-]", "i").test(groupname);
}

module.exports = {
  // API geändert von email() auf member und Methode umbenannt
  getSubscribedGroupsForMember: async function getSubscribedGroupsForMember(member, callback) {
    try {
      const groups = await groupstore.allGroups();
      callback(
        null,
        groups.filter((g) => g.subscribedMembers.includes(member.id()))
      );
    } catch (err) {
      callback(err);
    }
  },

  allGroupColors: async function allGroupColors(callback) {
    try {
      const groups = await groupstore.allGroups();
      const reduced = (groups || []).reduce((result, group) => {
        result[group.id] = group.color;
        return result;
      }, {});
      if (callback) {
        callback(null, reduced);
      } else {
        return reduced;
      }
    } catch (err) {
      if (callback) {
        callback(err);
      } else {
        throw err;
      }
    }
  },

  isGroupValid: async function isGroupValid(group, callback) {
    const errors = validation.isValidGroup(group);
    try {
      const existingGroup = await groupstore.getGroup(group.id);
      if (existingGroup) {
        return callback(errors);
      }
    } catch (e) {
      errors.push("Technical error validating the group.");
    }
    const self = this;
    self.isGroupNameAvailable(group.id, (err1, result) => {
      if (err1) {
        errors.push("Technical error validating name of group.");
      }
      if (!result) {
        errors.push("Dieser Gruppenname ist bereits vergeben.");
      }
      self.isEmailPrefixAvailable(group.emailPrefix, (err2, result1) => {
        if (err2) {
          errors.push("Technical error validating email prefix.");
        }
        if (!result1) {
          errors.push("Dieses Präfix ist bereits vergeben.");
        }
        callback(errors);
      });
    });
  },

  // API change email() -> member and renamed
  addMemberToGroupNamed: async function addMemberToGroupNamed(member, groupname, callback) {
    try {
      const group = await groupstore.getGroup(groupname);
      group.subscribe(member);
      groupstore.saveGroup(group, callback);
    } catch (e) {
      callback(e);
    }
  },

  // API change email() -> member and renamed
  removeMemberFromGroupNamed: async function removeMemberFromGroupNamed(member, groupname, callback) {
    try {
      const group = await groupstore.getGroup(groupname);
      group.unsubscribe(member);
      groupstore.saveGroup(group, callback);
    } catch (e) {
      return callback(e);
    }
  },

  // API change: email() -> member, oldUserMail removed
  updateSubscriptions: function updateSubscriptions(member, newSubscriptions, callback) {
    try {
      const groups = groupstore.allGroups();
      const subscribedGroups = groups.filter((g) => g.subscribedMembers.includes(member.id()));
      const groupsForNewSubscriptions = groups.filter((g) => misc.toArray(newSubscriptions).includes(g.id));

      const groupsToSubscribe = R.difference(groupsForNewSubscriptions, subscribedGroups);
      const groupsToUnsubscribe = R.difference(subscribedGroups, groupsForNewSubscriptions);

      groupsToSubscribe.forEach((g) => g.subscribe(member));
      groupsToUnsubscribe.forEach((g) => g.unsubscribe(member));

      async.each(groupsToSubscribe.concat(groupsToUnsubscribe), groupstore.saveGroup, callback);
    } catch (err) {
      callback(err);
    }
  },

  markGroupsSelected: function markGroupsSelected(groupsToMark, availableGroups) {
    return availableGroups.map((group) => ({ group, selected: groupsToMark.some((subG) => subG.id === group.id) }));
  },

  isGroupNameAvailable: async function isGroupNameAvailable(groupname, callback) {
    const trimmedGroupname = groupname.trim();
    if (isReserved(trimmedGroupname)) {
      return callback(null, false);
    }
    try {
      const group = await groupstore.getGroup(trimmedGroupname);
      callback(null, group === null);
    } catch (e) {
      callback(e, false);
    }
  },

  isEmailPrefixAvailable: async function isEmailPrefixAvailable(prefix, callback) {
    if (!prefix) {
      return callback(null, false);
    }
    try {
      const group = await groupstore.getGroupForPrefix(prefix.trim());
      callback(null, group === null);
    } catch (e) {
      callback(e);
    }
  },

  getGroups: async function getGroups(groupnames, callback) {
    try {
      const groups = await groupstore.groupsByLists(misc.toArray(groupnames));
      callback(null, groups);
    } catch (e) {
      callback(e);
    }
  },

  isReserved,
};
