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
        return callback(null, new Member().fromObject(result));
      }
      callback(null, null);
    };

    var toMemberList = function (callback, err, result) {
      if (err) {
        return callback(err);
      }
      async.map(result, function (each, cb) {
        cb(null, new Member().fromObject(each));
      }, callback);
    };

    memberstore = {
      allMembers    : function (callback) {
        persistence.list(async.apply(toMemberList, callback));
      },
      getMember     : function (nickname, callback) {
        persistence.getByField({nickname: nickname}, async.apply(toMember, callback));
      },
      getMemberForId: function (id, callback) {
        persistence.getById(id, async.apply(toMember, callback));
      },
      saveMember    : function (member, callback) {
        persistence.save(member, callback);
      }
    };
  }
  return memberstore;

};


