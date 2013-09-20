"use strict";
var _ = require("underscore");
var winston = require('winston');
var conf = require('nconf');
var logger = winston.loggers.get('application');
var async = require('async');

var validation = conf.get('beans').get('validation');
var groupstore = conf.get('beans').get('groupstore');
var misc = conf.get('beans').get('misc');

var sympaClient;
//Just checking if remote has been configured
if (conf.get('swkTrustedAppName') || conf.get('swkTrustedAppPwd')) {
  sympaClient = conf.get('beans').get('sympa');
} else {
  sympaClient = conf.get('beans').get('sympaStub');
}

module.exports = {
  getSubscribedGroupsForUser: function (userMail, globalCallback) {
    async.waterfall(
      [ function (callback) {
        sympaClient.getSubscribedListsForUser(userMail, callback);
      } ],
      function (err, subscribedLists) { groupstore.groupsByLists(subscribedLists, globalCallback); });
  },

  getAllAvailableGroups: function (globalCallback) {
    async.waterfall([ function (callback) { sympaClient.getAllAvailableLists(callback); } ],
      function (err, allLists) {
        if (err) {
          logger.error(err);
          globalCallback(err);
        }
        else {
          groupstore.groupsByLists(allLists, globalCallback);
        }
      });
  },

  allColors: function (callback) {
    this.getAllAvailableGroups(function (err, groups) {
      if (err) { callback(err); }
      var result = {};
      groups.forEach(function (each) {
        result[each.id] = each.color;
      });
      callback(null, result);
    });
  },

  getSympaUsersOfList: function (groupname, callback) {
    sympaClient.getUsersOfList(groupname, callback);
  },

  isGroupValid: function (group) {
    var self = this;
    var errors = validation.isValidGroup(group);
    self.getGroup(group.id, function (err, existingGroup) {
      if (!existingGroup) {
        self.isGroupNameAvailable(group.id, function (err, result) {
          if (err) { errors.push('Technical error validating name of group.'); }
          if (!result) { errors.push('Dieser Gruppenname ist bereits vergeben.'); }
        });
        self.isEmailPrefixAvailable(group.emailPrefix, function (err, result) {
          if (err) { errors.push('Technical error validating email prefix.'); }
          if (!result) { errors.push('Dieses Präfix ist bereits vergeben.'); }
        });
      }
    });
    return errors;
  },

  createOrSaveGroup: function (newGroup, globalCallback) {
    this.getGroup(newGroup.id, function (err, existingGroup) {
      async.parallel(
        [ function (callback) {
          if (!existingGroup) {
            sympaClient.createList(newGroup.id, newGroup.emailPrefix, callback);
          } else {
            callback(null);
          }
        },
          function (callback) { groupstore.saveGroup(newGroup, callback); }
        ],
        function (err) { globalCallback(err, newGroup); });
    });
  },

  addUserToList: function (userMail, list, callback) {
    sympaClient.addUserToList(userMail, list, callback);
  },

  removeUserFromList: function (userMail, list, callback) {
    sympaClient.removeUserFromList(userMail, list, callback);
  },

  updateAdminListSubscription: function (userMail, isAdmin, callback) {
    var adminList = conf.get('adminListName');
    var self = this;
    sympaClient.getSubscribedListsForUser(userMail, function (err, subscribedLists) {
      var subscriptions = subscribedLists;
      if (err) {return callback(err); }
      if (isAdmin) {
        subscriptions = _.union(subscriptions, misc.toArray(adminList));
      } else {
        subscriptions = _.without(subscriptions, adminList);
      }
      self.updateSubscriptions(userMail, userMail, subscriptions, callback);
    });
  },

  updateSubscriptions: function (userMail, oldUserMail, newSubscriptions, globalCallback) {
    async.waterfall(
      [ function (callback) {
        sympaClient.getSubscribedListsForUser(oldUserMail, callback);
      }
      ],
      function (err, subscribedLists) {
        if (err) {
          return globalCallback(err);
        }
        newSubscriptions = misc.toArray(newSubscriptions);
        var emailChanged = userMail !== oldUserMail;
        var listsToSubscribe = emailChanged ? newSubscriptions : _.difference(newSubscriptions, subscribedLists);
        var listsToUnsubscribe = emailChanged ? subscribedLists : _.difference(subscribedLists, newSubscriptions);
        // we must make sure that one list is completely subscribed for a new user before attempting to subscribe other lists
        // otherwise we get a racing condition in sympa
        var firstListToSubscribe = listsToSubscribe.pop();
        async.series(
          [ function (funCallback) {
            if (firstListToSubscribe) {
              return sympaClient.addUserToList(userMail, firstListToSubscribe, funCallback);
            }
            return funCallback(null);
          },
            function (funCallback) {
              var subscribe = function (list, callback) {
                sympaClient.addUserToList(userMail, list, callback);
              };
              async.map(listsToSubscribe, subscribe, funCallback);
            },
            function (funCallback) {
              var unsubscribe = function (list, callback) {
                sympaClient.removeUserFromList(oldUserMail, list, callback);
              };
              async.map(listsToUnsubscribe, unsubscribe, funCallback);
            }
          ],
          function (err) {
            globalCallback(err);
          });
      });
  },

  combineSubscribedAndAvailableGroups: function (subscribedGroups, availableGroups) {
    return availableGroups.map(function (group) {
      var findInSubscribed = function (availableGroup, subscribedGroup) {
        return subscribedGroup.id === availableGroup.id;
      };
      var isSelected = _.some(subscribedGroups, async.apply(findInSubscribed, group));
      return { group: group, selected: isSelected };
    });
  },

  isGroupNameAvailable: function (groupname, callback) {
    var trimmedGroupname = groupname.trim();
    if (this.isReserved(trimmedGroupname)) { return callback(null, false); }
    this.getGroup(trimmedGroupname, function (err, group) {
      if (err) { return callback(err); }
      callback(null, group === null);
    });
  },

  isEmailPrefixAvailable: function (prefix, callback) {
    var trimmedPrefix = prefix.trim();
    groupstore.getGroupForPrefix(trimmedPrefix, function (err, group) {
      if (err) { return callback(err); }
      callback(null, group === null);
    });
  },

  getGroup: function (groupname, callback) {
    groupstore.getGroup(groupname, callback);
  },

  getGroups: function (groupnames, callback) {
    groupstore.groupsByLists(misc.toArray(groupnames), callback);
  },

  isReserved: function (groupname) {
    return new RegExp('^edit$|^new$|^checkgroupname$|^submit$|^administration$|[^\\w-]', 'i').test(groupname);
  }

};
