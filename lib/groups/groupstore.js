"use strict";

module.exports = function (conf) {
  var persistence = require('../persistence/persistence')('groupstore', conf);

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

