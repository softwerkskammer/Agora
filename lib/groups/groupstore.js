"use strict";

var conf = require('nconf');
var async = require('async');
var _ = require('underscore');

var persistence = conf.get('beans').get('groupsPersistence');
var Group = conf.get('beans').get('group');

var toGroup = function (callback, err, result) {
  if (err) { return callback(err); }
  if (result) { return callback(null, new Group(result)); }
  callback(null, null);
};

var toGroupList = function (callback, err, result) {
  if (err) { return callback(err); }
  callback(null, _.map(result, function (each) { return new Group(each); }));
};

module.exports = {
  allGroups: function (callbackForGroups) {
    persistence.list({longName: 1}, async.apply(toGroupList, callbackForGroups));
  },

  groupsByLists: function (lists, callbackForGroups) {
    // TODO downcase listnames
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

