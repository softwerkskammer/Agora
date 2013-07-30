"use strict";
var conf = require('nconf');
var async = require('async');
var _ = require('underscore');

var persistence = conf.get('beans').get('activitiesPersistence');
var Activity = conf.get('beans').get('activity');

var toActivity = function (callback, err, activity) {
  if (err) { return callback(err); }
  if (activity) { return callback(null, new Activity(activity)); }
  callback(null, null);
};

var toActivityList = function (callback, err, activities) {
  if (err) { return callback(err); }
  callback(null, _.map(activities, function (activity) { return new Activity(activity); }));
};

module.exports = {
  allActivities: function (callback) {
    persistence.list({startUnix: 1}, async.apply(toActivityList, callback));
  },
  allActivitiesByDateRange: function (rangeFrom, rangeTo, callback) {
    persistence.listByField({ $and: [
      {startUnix: { $lt: rangeTo }},
      {endUnix: { $gt: rangeFrom }}
    ]}, {startUnix: 1}, async.apply(toActivityList, callback));
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
