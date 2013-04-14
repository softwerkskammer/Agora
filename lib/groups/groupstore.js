"use strict";

module.exports = function (conf) {
  var persistence = require('../persistence/persistence')('groupstore', conf);
  var async = require('async');
  var Group = require('./group');

  var toGroup = function (callback, err, result) {
    if (err) {
      return callback(err);
    }
    if (result) {
      return callback(null, new Group().fromObject(result));
    }
    callback(null, null);
  };

  var toGroupList = function (callback, err, result) {
    if (err) {
      return callback(err);
    }
    async.map(result, function (each, cb) {
      cb(null, new Group().fromObject(each));
    }, callback);
  };



  return {
    allGroups: function (callbackForGroups) {
      persistence.list({longName: 1}, async.apply(toGroupList, callbackForGroups));
    },

    groupsByLists: function (lists, callbackForGroups) {
      persistence.listByIds(lists, {longName: 1}, async.apply(toGroupList, callbackForGroups));
    },

    getGroup: function (name, callbackForGroup) {
      persistence.getById(name, async.apply(toGroup, callbackForGroup));
    },

    saveGroup: function (group, callback) {
      persistence.save(group, callback);
    }
  };
};

