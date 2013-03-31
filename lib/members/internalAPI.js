"use strict";

module.exports = function (conf) {

  var store = require('./memberstore')(conf);

  return {
    getMember: function (nickname, callback) {
      store.getMember(nickname, callback);
    },

    saveMember: function (member, next, callback) {
      if (member.isValid()) {
        store.saveMember(member, function (err) {
          if (err) {
            return callback(err);
          }
          callback(null, true);
        });
      } else {
        callback(null, false);
      }
    }
  };
};

