"use strict";

var memberstore;

module.exports = function (conf) {
  if (!memberstore) {
    var persistence = require('../persistence/persistence')('memberstore', conf);
    var async = require('async');
    var Member = require('./member');
    var fakes = [
      new Member('12345', 'hada', 'Hans', 'Dampf', 'hans.dampf@gmail.com', '@hada', 'Süden', 'Entwickler', 'ada', 'http://my.blog', 'beim Bier'),
      new Member('98765', 'heibe', 'Heinz', 'Becker', 'heinz@web.de', '@heibe', 'Daheim', 'Projektleiter', 'Logo', 'http://his.blog', 'durch meine Frau')
    ];

    async.each(fakes, function (fakeItem, callback) {
      persistence.save(fakeItem, callback);
    });

    var toMember = function (callback, err, result) {
      if (err) {
        return callback(err);
      }
      callback(null, new Member().fromObject(result));
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


