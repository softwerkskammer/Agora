"use strict";

var persistence = require('../persistence/persistence')('groupstore');
var async = require('async');
var Group = require('./group');

var fakes = [
  new Group('craftsmanswap', 'Craftsman Swaps', 'A group for organizing CS', 'Themengruppe'),
  new Group('neueplattform', 'Neue Plattform', 'Die Entwicklung der neuen SWK-Plattform', 'Themengruppe'),
  new Group('timbuktu', 'Softwerkskammer Timbuktu', 'Die Softwerkskammer-Regionalgruppe in Timbuktu', 'Regionalgruppe')
];

async.each(fakes, function (fakeItem, callback) {
  persistence.save(fakeItem, callback);
});

module.exports = {

  allGroups: function (callbackForGroups) {
    persistence.list(callbackForGroups);
  },

  getGroup: function (name, callbackForGroup) {
    var listname = name;
    var index = name.search('@softwerkskammer.de');
    if (index !== -1) {
      listname = name.substring(0, index);
    }
    persistence.getById(listname, callbackForGroup);
  },

  saveGroup: function (group, callback) {
    persistence.save(group, callback);
  }
};

