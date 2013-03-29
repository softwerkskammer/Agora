"use strict";

var persistence = require('../persistence/persistence')('groupstore');
var async = require('async');
var Group = require('./group');

var fakes = [
  new Group('craftsmanswap', 'Craftsman Swaps', 'A groups for organizing CS', 'Themengruppe'),
  new Group('neueplattform', 'Neue Plattform', 'Die Entwicklung der neuen SWK-Plattform', 'Themengruppe'),
  new Group('timbuktu', 'Softwerkskammer Timbuktu', 'Die Softwerkskammer-Regionalgruppe in Timbuktu', 'Regionalgruppe')
];

async.each(fakes, function (fakeItem, callback) {
  persistence.save(fakeItem, callback);
});

module.exports = {

  allMembers: function (callbackForGroups) {
    persistence.list(callbackForGroups);
  },

  getMember: function (name, callbackForMember) {
    persistence.getById(name, callbackForMember);
  },

  saveGroup: function (group, callback) {
    persistence.save(group, callback);
  }
};

