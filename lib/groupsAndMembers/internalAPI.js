"use strict";

module.exports = function (conf) {

  var members = require('../members/internalAPI')(conf);
  var groups = require('../groups/internalAPI')(conf);
  var async = require('async');

  return {
    getUserWithHisLists: function (nickname, globalCallback) {
      async.waterfall([
        function (callback) {
          members.getMember(nickname, callback);
        },
        function (member, callback) {
          groups.getSubscribedListsForUser(member.email, async.apply(callback, member));
        }
      ],
        // callback for results of last function
        function (member, err, subscribedLists) {
          globalCallback(member, subscribedLists);
        });
    }
  };
};

