"use strict";

module.exports = function (conf) {

  var store = require('./memberstore')(conf);

  return {
    getMember: function (nickname, callback) {
      store.getMember(nickname, callback);
    },

    saveMember: function (member, callback) {
      if (member.isValid()) {
        store.saveMember(member, function (err) {
          if (err) {
            return callback(err);
          }
          callback(null, member);
        });
      } else {
        callback(null, member.markErrors());
      }
    }
  };
};

