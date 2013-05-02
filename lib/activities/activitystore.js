"use strict";
var conf = require('nconf');
var async = require('async');

var persistence = conf.get('beans').get('activitiesPersistence');
var Activity = conf.get('beans').get('activity');

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
  getActivity: function (url, callback) {
    persistence.getByField({url: url}, async.apply(toActivity, callback));
  },
  getActivityForId: function (id, callback) {
    persistence.getById(id, async.apply(toActivity, callback));
  },
  saveActivity: function (activity, callback) {
    persistence.save(activity, callback);
  }
};


