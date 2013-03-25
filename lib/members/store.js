"use strict";

var persistence = require('../persistence/persistence')('memberstore');
var async = require('async');
var Member = require('./member');

var fakes = [
  new Member('hada', 'Hans', 'Dampf', 'hans.dampf@gmail.com', '@hada', 'Süden', 'Entwickler', 'ada', 'http://my.blog', 'beim Bier'),
  new Member('heibe', 'Heinz', 'Becker', 'heinz@web.de', '@heibe', 'Daheim', 'Projektleiter', 'Logo', 'http://his.blog', 'durch meine Frau')
];

async.each(fakes, function (fakeItem, callback) {
  persistence.save(fakeItem, callback);
});

module.exports = {

  allMembers: function (callbackForMembers) {
    persistence.list(function (members) {
      callbackForMembers(members);
    });
  },

  getMember: function (nickname, callbackForMember) {
    persistence.getById(nickname, callbackForMember);
  }
};

