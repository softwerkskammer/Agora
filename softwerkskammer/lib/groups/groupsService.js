const R = require('ramda');
const conf = require('simple-configure');
const async = require('async');

const beans = conf.get('beans');
const validation = beans.get('validation');
const groupstore = beans.get('groupstore');
const misc = beans.get('misc');

function isReserved(groupname) {
  return new RegExp('^edit$|^new$|^checkgroupname$|^submit$|^administration$|[^\\w-]', 'i').test(groupname);
}

module.exports = {
  // API geändert von email() auf member und Methode umbenannt
  getSubscribedGroupsForMember: function getSubscribedGroupsForMember(member, callback) {
    groupstore.allGroups((err, groups) => {
      if (err) { return callback(err); }
      callback(null, groups.filter(g => g.subscribedMembers.includes(member.id())));
    });
  },

  allGroupColors: function allGroupColors(callback) {
    groupstore.allGroups((err, groups) => {
      callback(err, (groups || []).reduce((result, group) => {
        result[group.id] = group.color;
        return result;
      }, {}));
    });
  },

  isGroupValid: function isGroupValid(group, callback) {
    const self = this;
    const errors = validation.isValidGroup(group);
    groupstore.getGroup(group.id, (err, existingGroup) => {
      if (err) { errors.push('Technical error validating the group.'); }
      if (existingGroup) { return callback(errors); }
      self.isGroupNameAvailable(group.id, (err1, result) => {
        if (err1) { errors.push('Technical error validating name of group.'); }
        if (!result) { errors.push('Dieser Gruppenname ist bereits vergeben.'); }
        self.isEmailPrefixAvailable(group.emailPrefix, (err2, result1) => {
          if (err2) { errors.push('Technical error validating email prefix.'); }
          if (!result1) { errors.push('Dieses Präfix ist bereits vergeben.'); }
          callback(errors);
        });
      });
    });
  },

  // API change email() -> member and renamed
  addMemberToGroupNamed: function addMemberToGroupNamed(member, groupname, callback) {
    groupstore.getGroup(groupname, (err, group) => {
      if (err) { return callback(err); }
      group.subscribe(member);
      groupstore.saveGroup(group, callback);
    });
  },

  // API change email() -> member and renamed
  removeMemberFromGroupNamed: function removeMemberFromGroupNamed(member, groupname, callback) {
    groupstore.getGroup(groupname, (err, group) => {
      if (err) { return callback(err); }
      group.unsubscribe(member);
      groupstore.saveGroup(group, callback);
    });
  },

  // API change: email() -> member, oldUserMail removed
  updateSubscriptions: function updateSubscriptions(member, newSubscriptions, callback) {
    groupstore.allGroups((err, groups) => {
      if (err) { return callback(err); }
      const subscribedGroups = groups.filter(g => g.subscribedMembers.includes(member.id()));
      const groupsForNewSubscriptions = groups.filter(g => misc.toArray(newSubscriptions).includes(g.id));

      const groupsToSubscribe = R.difference(groupsForNewSubscriptions, subscribedGroups);
      const groupsToUnsubscribe = R.difference(subscribedGroups, groupsForNewSubscriptions);

      groupsToSubscribe.forEach(g => g.subscribe(member));
      groupsToUnsubscribe.forEach(g => g.unsubscribe(member));

      async.each(groupsToSubscribe.concat(groupsToUnsubscribe), groupstore.saveGroup, callback);
    });
  },

  markGroupsSelected: function markGroupsSelected(groupsToMark, availableGroups) {
    return availableGroups.map(group => ({group, selected: groupsToMark.some(subG => subG.id === group.id)}));
  },

  isGroupNameAvailable: function isGroupNameAvailable(groupname, callback) {
    const trimmedGroupname = groupname.trim();
    if (isReserved(trimmedGroupname)) { return callback(null, false); }
    groupstore.getGroup(trimmedGroupname, (err, group) => callback(err, group === null));
  },

  isEmailPrefixAvailable: function isEmailPrefixAvailable(prefix, callback) {
    if (!prefix) { return callback(null, false); }
    groupstore.getGroupForPrefix(prefix.trim(), (err, group) => callback(err, group === null));
  },

  getGroups: function getGroups(groupnames, callback) {
    groupstore.groupsByLists(misc.toArray(groupnames), callback);
  },

  isReserved
};
