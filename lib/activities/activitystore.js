"use strict";
var persistence = require('../persistence/persistence')('activitystore');
var async = require('async');
var Activity = require('./activity');

var toActivity = function (callback, err, result) {
  if (err) {
    return callback(err);
  }
  if (result) {
    return callback(null, new Activity(result));
  }
  callback(null, null);
};

var toActivityList = function (callback, err, result) {
  if (err) {
    return callback(err);
  }
  async.map(result, function (each, cb) {
    cb(null, new Activity(each));
  }, callback);
};

module.exports = {
  allActivities: function (callback) {
    persistence.list({startUnix: 1}, async.apply(toActivityList, callback));
  },
  allActivitiesByDateRange: function (rangeFrom, rangeTo, callback) {
    persistence.listByField({startUnix: { $gt: rangeFrom, $lt: rangeTo }}, {startUnix: 1}, async.apply(toActivityList, callback));
  },
  getActivity: function (id, callback) {
    persistence.getByField({id: id}, async.apply(toActivity, callback));
  },
  getActivityForId: function (id, callback) {
    persistence.getById(id, async.apply(toActivity, callback));
  },
  saveActivity: function (activity, callback) {
    persistence.save(activity, callback);
  }
};


