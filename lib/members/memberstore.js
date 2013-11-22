"use strict";

var async = require('async');
var beans = require('nconf').get('beans');
var _ = require('underscore');
var persistence = beans.get('membersPersistence');
var Member = beans.get('member');
var misc = beans.get('misc');

var toMember = function (callback, err, result) {
  if (err) { return callback(err); }
  if (result) { return callback(null, new Member(result)); }
  callback(null, result);
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
    if (emails.length === 0) { return callback(null, []); }
    persistence.listByField({email: misc.arrayToLowerCaseRegExp(emails)}, {lastname: 1, firstname: 1}, async.apply(toMemberList, callback));
  },

  getMember: function (nickname, callback) {
    persistence.getByField({nickname: misc.toLowerCaseRegExp(nickname.trim())}, async.apply(toMember, callback));
  },

  getMemberForId: function (id, callback) {
    persistence.getById(id, async.apply(toMember, callback));
  },

  getMemberForAuthentication: function (authenticationId, callback) {
    persistence.getByField({authentications: authenticationId}, async.apply(toMember, callback));
  },

  getMembersForIds: function (ids, callback) {
    persistence.listByIds(ids, {lastname: 1, firstname: 1}, async.apply(toMemberList, callback));
  },

  getMemberForEMail: function (email, callback) {
    persistence.getByField({email: misc.toLowerCaseRegExp(email)}, async.apply(toMember, callback));
  },
  saveMember: function (member, callback) {
    persistence.save(member, callback);
  }
};


