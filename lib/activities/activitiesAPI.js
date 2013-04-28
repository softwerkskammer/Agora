"use strict";

var store = require('./activitystore');
var validation = require('../commons/validation');
var moment = require('moment');

module.exports = {
  getActivity: function (id, callback) {
    store.getActivity(id, callback);
  },

  allActivities: function (callback) {
    store.allActivities(callback);
  },

  upcomingActivities: function (callback) {
    var now = moment().unix();
    var until = moment().add('y', 10).unix();
    store.allActivitiesByDateRange(now, until, function (err, activities) {
      if (err) {
        return callback(err);
      }
      callback(null, activities);
    });
  },

  activitiesBetween: function (startMoment, endMoment, callback) {
    store.allActivitiesByDateRange(startMoment.unix(), endMoment.unix(), function (err, activities) {
      if (err) {
        return callback(err);
      }
      callback(null, activities.map(function (activity) {
        return activity.asCalendarEvent();
      }));
    });
  },

  getActivityForId: function (id, callback) {
    store.getActivityForId(id, callback);
  },

  saveActivity: function (activity, callback) {
    store.saveActivity(activity, function (err) {
      if (err) {
        return callback(err);
      }
    });
    callback(null, activity);
  },

  updateActivityFieldWith: function (id, field, value, callback) {
    var api = this;
    api.getActivity(id, function (err, result) {
      result[field] = value;
      var errors = validation.isValidActivity(result);
      if (errors.length !== 0) {
        return callback(false, errors);
      }
      api.saveActivity(result, function (err, result) {
        if (err || !result) {
          return callback(false);
        }
        callback(true);
      });
    });
  }
};
