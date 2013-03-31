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

    var toMember = function (callback) {
      return function (err, result) {
        if (err) {
          return callback(err);
        }
        callback(null, new Member().fromObject(result));
      };
    };

    memberstore = {
      allMembers    : function (callback) {
        // TODO auch als member umwandeln (leider) -> Wie geht das elegant?
        persistence.list(callback);
      },
      getMember     : function (nickname, callback) {
        persistence.getByField({nickname: nickname}, toMember(callback));
      },
      getMemberForId: function (id, callback) {
        persistence.getById(id, toMember(callback));
      },
      saveMember    : function (member, callback) {
        persistence.save(member, callback);
      }
    };
  }
  return memberstore;

};


