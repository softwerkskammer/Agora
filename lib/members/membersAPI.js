"use strict";

var conf = require('nconf');
var store = conf.get('beans').get('memberstore');
var validation = conf.get('beans').get('validation');

var checkMember = function (member, callback, api) {
  var errors = validation.isValidMember(member);
  if (errors.length !== 0) {
    return callback(false, errors);
  }
  api.saveMember(member, function (err, result) {
    if (err || !result) { return callback(false, []); }
    callback(true);
  });
};

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
    if (this.containsNonalphanumericChars(trimmedNick)) {
      return callback(null, false);
    }
    this.getMember(trimmedNick, function (err, result) {
      if (err) { return callback(err); }
      callback(null, result === null);
    });
  },

  isReserved: function (nickname) {
    return new RegExp('^edit$|^new$|^checknickname$|^submit$|^administration$|\\+', 'i').test(nickname);
  },

  containsNonalphanumericChars: function (nickname) {
    return !new RegExp('^\\w+$', 'i').test(nickname);
  },

  updateMembersFieldWith: function (id, field, value, callback) {
    var api = this;
    api.getMemberForId(id, function (err, member) {
      if (field === 'nickname' && member.nickname !== value) {
        api.isValidNickname(value, function (err, check) {
          if (err || !check) { return callback(false, ['Dieser Nickname ist leider nicht verfügbar.']); }
          member.nickname = value;
          checkMember(member, callback, api);
        });
      } else {
        if (field === 'twitter') { member.setTwitter(value); }
        else if (field === 'isAdmin') { member.setAdminFromInteger(value); }
        else { member[field] = value; }
        checkMember(member, callback, api);
      }
    });
  }
};

