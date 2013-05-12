"use strict";

var conf = require('nconf');
var async = require('async');
var _ = require('underscore');
var persistence = conf.get('beans').get('mailsPersistence');
var Mail = conf.get('beans').get('archivedMail');
var membersAPI = conf.get('beans').get('membersAPI');

var toMail = function (callback, err, mail) {
  if (err) { return callback(err); }
  if (mail) { return callback(null, new Mail(mail)); }
  callback(null, null);
};

var toMailList = function (callback, err, mails) {
  if (err) { return callback(err); }
  callback(null, _.map(mails, function (mail) { return new Mail(mail); }));
};

module.exports = {
  mailHeaders: function (searchObject, sortObject, callback) {
    persistence.listByFieldWithOptions(searchObject,
      {text: 0, html: 0},
      sortObject,
      async.apply(toMailList, callback));
  },

  mailForId: function (id, callback) {
    persistence.getById(id, async.apply(toMail, callback));
  },

  addMemberNick: function (mailHeader, callback) {
    if (!mailHeader || !mailHeader.memberId) { return callback(); }
    membersAPI.getMemberForId(mailHeader.memberId, function (err, member) {
      if (err) { return callback(err); }
      if (member) {
        mailHeader.memberNickname = member.nickname;
      }
      callback();
    });
  }
};
