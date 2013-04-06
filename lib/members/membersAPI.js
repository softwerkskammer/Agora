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
    },

    isValidNickname: function (nickname, callback) {
      var trimmedNick = nickname.trim();
      if (this.isReserved(trimmedNick)) {
        return callback(null, false);
      }
      this.getMember(trimmedNick, function (err, result) {
        if (err) {
          return callback(err);
        }
        callback(null, result === null);
      });
    },

    isReserved: function (nickname) {
      return new RegExp('^edit$|^new$|^checknickname$|^submit$|\\W+', 'i').test(nickname);
    }
  };
};

