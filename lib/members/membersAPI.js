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

    getMemberForEMail: function (email, callback) {
      store.getMemberForEMail(email, callback);
    },

    getMembersForEMails: function (emails, callback) {
      store.getMembersForEMails(emails, callback);
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
      return new RegExp('^edit$|^new$|^checknickname$|^submit$|^administration$|\\W+', 'i').test(nickname);
    },

    updateMembersFieldWith: function (nickname, field, value, callback) {
      var api = this;
      api.getMember(nickname, function (err, result) {
        if (field === 'twitter') {
          result.setTwitter(value);
        } else if (field === 'isAdmin') {
          result.setAdminFromInteger(value);
        } else {
          result[field] = value;
        }
        api.saveMember(result, function (err, result) {
          if (err || !result) {
            return callback(false);
          }
          callback(true);

        });
      });

    }
  };
};

