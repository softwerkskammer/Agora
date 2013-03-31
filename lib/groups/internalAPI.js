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

  var filterValidLists = function (lists, globalCallback) {
    var validLists = [];
    if (lists) {
      validLists = lists.filter(function (list) {
        return list ? true : false;
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
      function (err, lists) {
        filterValidLists(lists, globalCallback);
      }
    );
  };

  return {
    getSubscribedListsForUser: function (userMail, globalCallback) {
      async.waterfall([
        function (callback) {
          sympaClient.getSubscribedListsForUser(userMail, callback);
        }
      ],
        function (err, subscribedLists) {
          getGroupsForLists(subscribedLists, globalCallback);
        });
    },

    getAllAvailableLists: function (globalCallback) {
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

