'use strict';
const R = require('ramda');
const conf = require('simple-configure');
const async = require('async');

const beans = conf.get('beans');
const validation = beans.get('validation');
const groupstore = beans.get('groupstore');
const misc = beans.get('misc');

//Just checking if remote has been configured
const listAdapter = conf.get('fullyQualifiedHomeDir') ? beans.get('ezmlmAdapter') : beans.get('fakeListAdapter');

function isReserved(groupname) {
  return new RegExp('^edit$|^new$|^checkgroupname$|^submit$|^administration$|[^\\w-]', 'i').test(groupname);
}

function subscribedListsForUser(userMail, callback) {
  listAdapter.getSubscribedListsForUser(userMail, (err, lists) => {
    callback(err, R.without(conf.get('adminListName'), lists || []));
  });
}

function groupsForRetriever(retriever, callback) {
  async.waterfall([retriever],
    (err, lists) => {
      if (err) { return callback(err); }
      groupstore.groupsByLists(lists, callback);
    });
}

module.exports = {
  getSubscribedGroupsForUser: function getSubscribedGroupsForUser(userMail, callback) {
    groupsForRetriever(cb => subscribedListsForUser(userMail, cb), callback);
  },

  getAllAvailableGroups: function getAllAvailableGroups(callback) {
    groupsForRetriever(cb => listAdapter.getAllAvailableLists(cb), callback);
  },

  allGroupColors: function allGroupColors(callback) {
    this.getAllAvailableGroups((err, groups) => {
      callback(err, (groups || []).reduce((result, group) => {
        result[group.id] = group.color;
        return result;
      }, {}));
    });
  },

  getMailinglistUsersOfList: function getMailinglistUsersOfList(groupname, callback) {
    listAdapter.getUsersOfList(groupname, callback);
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

  createOrSaveGroup: function createOrSaveGroup(newGroup, callback) {
    groupstore.getGroup(newGroup.id, (err, existingGroup) => {
      if (err) { return callback(err, existingGroup); }

      async.parallel(
        [
          cb => {
            if (!existingGroup) {
              listAdapter.createList(newGroup.id, newGroup.emailPrefix, cb);
            } else {
              cb();
            }
          },
          cb => groupstore.saveGroup(newGroup, cb)
        ],
        err1 => callback(err1, existingGroup)
      );
    });
  },

  addUserToList: function addUserToList(userMail, list, callback) {
    listAdapter.addUserToList(userMail, list, callback);
  },

  removeUserFromList: function removeUserFromList(userMail, list, callback) {
    listAdapter.removeUserFromList(userMail, list, callback);
  },

  updateSubscriptions: function updateSubscriptions(userMail, oldUserMail, newSubscriptions, callback) {
    async.waterfall(
      [
        cb => subscribedListsForUser(oldUserMail, cb)
      ],
      (err, subscribedLists) => {
        if (err) { return callback(err); }
        newSubscriptions = misc.toArray(newSubscriptions);
        const emailChanged = userMail !== oldUserMail;
        const listsToSubscribe = emailChanged ? newSubscriptions : R.difference(newSubscriptions, subscribedLists);
        const listsToUnsubscribe = emailChanged ? subscribedLists : R.difference(subscribedLists, newSubscriptions);
        async.series(
          [
            funCallback => {
              function subscribe(list, cb) {
                listAdapter.addUserToList(userMail, list, cb);
              }

              async.each(listsToSubscribe, subscribe, funCallback);
            },
            funCallback => {
              function unsubscribe(list, cb) {
                listAdapter.removeUserFromList(oldUserMail, list, cb);
              }

              async.each(listsToUnsubscribe, unsubscribe, funCallback);
            }
          ],
          err1 => callback(err1)
        );
      }
    );
  },

  combineSubscribedAndAvailableGroups: function combineSubscribedAndAvailableGroups(subscribedGroups, availableGroups) {
    return availableGroups.map(group => {
      return {group, selected: subscribedGroups.some(subG => subG.id === group.id)};
    });
  },

  isGroupNameAvailable: function isGroupNameAvailable(groupname, callback) {
    const trimmedGroupname = groupname.trim();
    if (isReserved(trimmedGroupname)) { return callback(null, false); }
    groupstore.getGroup(trimmedGroupname, (err, group) => callback(err, group === null));
  },

  isEmailPrefixAvailable: function isEmailPrefixAvailable(prefix, callback) {
    if (!prefix) { callback(null, false); }
    groupstore.getGroupForPrefix(prefix.trim(), (err, group) => callback(err, group === null));
  },

  getGroups: function getGroups(groupnames, callback) {
    groupstore.groupsByLists(misc.toArray(groupnames), callback);
  },

  isReserved
};
