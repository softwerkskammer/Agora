"use strict";

var memberstore;

module.exports = function (conf) {
  if (!memberstore) {
    var persistence = require('../persistence/persistence')('memberstore', conf);
    var async = require('async');
    var Member = require('./member');

    var toMember = function (callback, err, result) {
      if (err) {
        return callback(err);
      }
      if (result) {
        return callback(null, new Member({object: result}));
      }
      callback(null, null);
    };

    var toMemberList = function (callback, err, result) {
      if (err) {
        return callback(err);
      }
      async.map(result, function (each, cb) {
        cb(null, new Member({object: each}));
      }, callback);
    };

    memberstore = {
      allMembers    : function (callback) {
        persistence.list({lastname: 1, firstname: 1}, async.apply(toMemberList, callback));
      },
      getMembersForEMails: function (emails, callback) {
        persistence.listByEMails(emails, {lastname: 1, firstname: 1}, callback);
      },
      getMember     : function (nickname, callback) {
        persistence.getByField({nickname: new RegExp('^' + nickname + '$', 'i')}, async.apply(toMember, callback));
      },
      getMemberForId: function (id, callback) {
        persistence.getById(id, async.apply(toMember, callback));
      },
      getMemberForEMail: function (email, callback) {
        persistence.getByField({email: new RegExp('^' + email + '$', 'i')}, async.apply(toMember, callback));
      },
      saveMember    : function (member, callback) {
        persistence.save(member, callback);
      }
    };
  }
  return memberstore;

};


