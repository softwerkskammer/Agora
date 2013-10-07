"use strict";

var conf = require('nconf');
var store = conf.get('beans').get('memberstore');

module.exports = {

  getMember: function (nickname, callback) {
    store.getMember(nickname, callback);
  },

  allMembers: function (callback) {
    store.allMembers(callback);
  },

  getMemberForId: function (id, callback) {
    store.getMemberForId(id, callback);
  },

  getMembersForIds: function (id, callback) {
    store.getMembersForIds(id, callback);
  },

  getMemberForEMail: function (email, callback) {
    store.getMemberForEMail(email, callback);
  },

  getMembersForEMails: function (emails, callback) {
    store.getMembersForEMails(emails, callback);
  },

  saveMember: function (member, callback) {
    store.saveMember(member, function (err) {
      if (err) { return callback(err); }
      callback(null, member);
    });
  },

  isValidNickname: function (nickname, callback) {
    var trimmedNick = nickname.trim();
    if (this.isReserved(trimmedNick)) {
      return callback(null, false);
    }
    this.getMember(trimmedNick, function (err, result) {
      if (err) { return callback(err); }
      callback(null, result === null);
    });
  },

  isReserved: function (nickname) {
    return new RegExp('^edit$|^new$|^checknickname$|^submit$|^administration$|^[.][.]$|^[.]$|\\+', 'i').test(nickname);
  }
};

