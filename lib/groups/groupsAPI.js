"use strict";
var _ = require("underscore");

module.exports = function (conf) {

  var sympaClient;
  //Just checking if remote has been configured
  if (conf.get('swkTrustedAppName') || conf.get('swkTrustedAppPwd')) {
    sympaClient = require('./sympa')(conf);
  }
  else {
    sympaClient = require('./sympaStub')({});
  }

  var groupstore = require('./groupstore')(conf);
  var async = require('async');
  var Group = require('./group');
  var transformer = require('./sympaTransformer')();

  var filterValidGroups = function (groups, globalCallback) {
    var validLists = [];
    if (groups) {
      validLists = groups.filter(function (group) {
        return !!group;
      });
      if (validLists.length === 0) {
        validLists = [];
      }
    }
    globalCallback(null, validLists);
  };

  var getGroupsForLists = function (lists, globalCallback) {
    var iterator = function (list, callback) {
      groupstore.getGroup(list, callback);
    };
    async.waterfall([
      function (callback) {
        async.map(lists, iterator, callback);
      }
    ],
      function (err, groups) {
        filterValidGroups(groups, globalCallback);
      }
    );
  };

  var getGroup = function (groupname, callback) {
    groupstore.getGroup(groupname, callback);
  };

  var createGroup = function (group, callback) {
    async.parallel([
      function (callback) {
        sympaClient.createList(group.id, callback);
      },
      function (callback) {
        saveGroup(group, callback);
      }
    ],
    function (err) {
      callback(err, group);
    });
  };

  var saveGroup = function (group, callback) {
    groupstore.saveGroup(group, callback);
  };

  return {
    getSubscribedGroupsForUser: function (userMail, globalCallback) {
      async.waterfall([
        function (callback) {
          sympaClient.getSubscribedListsForUser(userMail, callback);
        }
      ],
        function (err, subscribedLists) {
          getGroupsForLists(subscribedLists, globalCallback);
        });
    },

    getAllAvailableGroups: function (globalCallback) {
      async.waterfall([
        function (callback) {
          sympaClient.getAllAvailableLists(callback);
        }
      ],
        function (err, allLists) {
          if (err) {
            console.log(err);
          } else {
            getGroupsForLists(allLists, globalCallback);
          }
        });
    },

    getSympaUsersOfList: function (groupname, callback) {
      sympaClient.getUsersOfList(groupname, callback);
    },

    createOrSaveGroup: function (newGroup, globalCallback) {
      getGroup(newGroup.id, function (err, group) {
        if (group) {
          saveGroup(newGroup, globalCallback);
        } else {
          createGroup(newGroup, globalCallback);
        }
      });
    },

    groupFromObject: function (groupObject) {
      return new Group().fromObject(groupObject);
    },

    updateSubscriptions: function (userMail, newSubscriptions, globalCallback) {
      async.waterfall([
        function (callback) {
          sympaClient.getSubscribedListsForUser(userMail, callback);
        }
      ],
        function (err, subscribedLists) {
          if (err) {
            return globalCallback(err);
          }
          newSubscriptions = transformer.toArray(newSubscriptions);
          var listsToSubscribe = _.difference(newSubscriptions, subscribedLists);
          var listsToUnsubscribe = _.difference(subscribedLists, newSubscriptions);
          async.parallel([
            function (funCallback) {
              var subscribe = function (list, callback) {
                sympaClient.addUserToList(userMail, list, callback);
              };
              async.map(listsToSubscribe, subscribe, funCallback);
            },
            function (funCallback) {
              var unsubscribe = function (list, callback) {
                sympaClient.removeUserFromList(userMail, list, callback);
              };
              async.map(listsToUnsubscribe, unsubscribe, funCallback);
            }
          ],
          function (err) {
            globalCallback(err);
          });
        });
    },

    getGroup: getGroup,
    createGroup: createGroup,
    saveGroup: saveGroup
  };
};

