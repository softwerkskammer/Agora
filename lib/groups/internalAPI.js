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

  var groupstore = require('../groups/groupstore');
  var async = require('async');

  var filterValidLists = function (lists, globalCallback) {
    var validLists = [];
    if (lists) {
      validLists = lists.filter(function (list) {
        return list !== undefined;
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
      function (lists) {
        filterValidLists(lists, globalCallback);
      }
    );
  };

  var getUsersForMailaddresses = function (userAddresses, globalCallback) {
    // TODO!
    globalCallback(null, []);
  };

  return {
    getSubscribedListsForUser: function (email, globalCallback) {
      async.waterfall([
        function (callback) {
          sympaClient.getSubscribedListsForUser(email, callback);
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

    getUsersOfList: function (groupname, globalCallback) {
      async.waterfall([
        function (callback) {
          sympaClient.getUsersOfList(groupname, callback);
        }
      ],
        function (err, userAddresses) {
          getUsersForMailaddresses(userAddresses, globalCallback);
        });
    }
  };
};

