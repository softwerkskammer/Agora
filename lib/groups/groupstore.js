"use strict";

module.exports = function (conf) {
  var persistence = require('../persistence/persistence')('groupstore', conf);
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

  return {

    allGroups: function (callbackForGroups) {
      persistence.list(callbackForGroups);
    },

    getGroup: function (name, callbackForGroup) {
      persistence.getById(name, callbackForGroup);
    },

    saveGroup: function (group, callback) {
      persistence.save(group, callback);
    }
  };
};

