"use strict";

var async = require('async');
var conf = require('nconf');
var _ = require('underscore');

var persistence = conf.get('beans').get('membersPersistence');
var Member = conf.get('beans').get('member');

var toMember = function (callback, err, result) {
  if (err) { return callback(err); }
  if (result) { return callback(null, new Member(result)); }
  callback(null, null);
};

var toMemberList = function (callback, err, result) {
  if (err) { return callback(err); }
  callback(null, _.map(result, function (each) { return new Member(each); }));
};

module.exports = {
  allMembers: function (callback) {
    persistence.list({lastname: 1, firstname: 1}, async.apply(toMemberList, callback));
  },
  getMembersForEMails: function (emails, callback) {
    persistence.listByEMails(emails, {lastname: 1, firstname: 1}, callback);
  },
  getMember: function (nickname, callback) {
    persistence.getByField({nickname: new RegExp('^' + nickname.trim() + '$', 'i')}, async.apply(toMember, callback));
  },
  getMemberForId: function (id, callback) {
    persistence.getById(id, async.apply(toMember, callback));
  },

  getMembersForIds: function (ids, callback) {
    persistence.listByIds(ids, {}, callback);
  },

  getMemberForEMail: function (email, callback) {
    persistence.getByField({email: new RegExp('^' + email + '$', 'i')}, async.apply(toMember, callback));
  },
  saveMember: function (member, callback) {
    persistence.save(member, callback);
  }
};


