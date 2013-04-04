"use strict";

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
      groupstore.getGroup(list.groupName, callback);
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

    getGroup: getGroup,
    createGroup: createGroup,
    saveGroup: saveGroup
  };
};

