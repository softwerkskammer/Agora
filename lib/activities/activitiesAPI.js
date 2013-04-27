"use strict";

var store = require('./activitystore');

module.exports = {
  getActivity: function (id, callback) {
    store.getActivity(id, callback);
  },

  allActivities: function (callback) {
    store.allActivities(callback);
  },

  allActivitiesNextMonth: function (callback) {
    store.allActivities(callback);
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
  }
};
