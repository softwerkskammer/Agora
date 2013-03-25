"use strict";

var Persistence = require('../persistence/persistence')('memberstore');
var Member = require('./member');

var fakes = [
  new Member('hada', 'Hans', 'Dampf', 'hans.dampf@gmail.com', '@hada', 'Süden', 'Entwickler', 'ada', 'http://my.blog', 'beim Bier'),
  new Member('heibe', 'Heinz', 'Becker', 'heinz@web.de', '@heibe', 'Daheim', 'Projektleiter', 'Logo', 'http://his.blog', 'durch meine Frau')
];

for (var i = 0; i < fakes.length; i++) {
  Persistence.save(fakes[i]);
}

module.exports = {

  allMembers: function (callbackForMembers) {
    Persistence.list(function (members) {
      callbackForMembers(members);
    });
  },

  getMember: function (nickname, callbackForMember) {
    Persistence.getById(nickname, callbackForMember);
  },

  saveMember: function (member, callbackForMember) {
    Persistence.save(member);
    callbackForMember(member);
  }
};

