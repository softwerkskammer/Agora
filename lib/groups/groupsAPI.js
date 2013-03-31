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
      groupstore.getGroup(list.listAddress, callback);
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
    }

  };
};

