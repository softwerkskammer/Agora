"use strict";

module.exports = function (conf) {

  var store = require('./memberstore')(conf);

  return {
    getMember: function (nickname, callback) {
      store.getMember(nickname, callback);
    },

    allMembers: function (callback) {
      store.allMembers(callback);
    },

    getMemberForId: function (id, callback) {
      store.getMemberForId(id, callback);
    },

    saveMember: function (member, callback) {
      if (member.isValid()) {
        store.saveMember(member, function (err) {
          if (err) {
            return callback(err);
          }
        });
      }
      callback(null, member);
    }
  };
};

