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
    var store = this;
    async.map(emails, function (item, cb) { store.getMemberForEMail(item, cb); }, function (err, results) {
      if (err) { return callback(err); }
      var validResults = _.compact(results);
      var sortedByFirstName = _.sortBy(validResults, function (elem) { return elem.firstname; });
      callback(null, _.sortBy(sortedByFirstName, function (elem) { return elem.lastname; }));
    });
  },
  
  getMember: function (nickname, callback) {
    persistence.getByField({nickname: misc.toLowerCaseRegExp(nickname.trim())}, async.apply(toMember, callback));
  },

  getMemberForId: function (id, callback) {
    persistence.getById(id, async.apply(toMember, callback));
  },

  getMembersForIds: function (ids, callback) {
    persistence.listByIds(ids, {}, callback);
  },

  getMemberForEMail: function (email, callback) {
    persistence.getByField({email: misc.toLowerCaseRegExp(email)}, async.apply(toMember, callback));
  },
  saveMember: function (member, callback) {
    persistence.save(member, callback);
  }
};


