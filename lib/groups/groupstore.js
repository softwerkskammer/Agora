"use strict";

var persistence = require('../persistence/persistence')('groupstore');
var async = require('async');
var Group = require('./group');

var toGroup = function (callback, err, result) {
  if (err) {
    return callback(err);
  }
  if (result) {
    return callback(null, new Group(result));
  }
  callback(null, null);
};

var toGroupList = function (callback, err, result) {
  if (err) {
    return callback(err);
  }
  async.map(result, function (each, cb) {
    cb(null, new Group(each));
  }, callback);
};

module.exports = {
  allGroups: function (callbackForGroups) {
    persistence.list({longName: 1}, async.apply(toGroupList, callbackForGroups));
  },

  groupsByLists: function (lists, callbackForGroups) {
    persistence.listByIds(lists, {longName: 1}, async.apply(toGroupList, callbackForGroups));
  },

  getGroup: function (name, callbackForGroup) {
    var downCasedName = new RegExp('^' + name + '$', 'i');
    persistence.getById(downCasedName, async.apply(toGroup, callbackForGroup));
  },

  getGroupForPrefix: function (prefix, callbackForGroup) {
    var downCasedName = new RegExp('^' + prefix + '$', 'i');
    persistence.getByField({emailPrefix: downCasedName}, async.apply(toGroup, callbackForGroup));
  },

  saveGroup: function (group, callback) {
    persistence.save(group, callback);
  }
};

