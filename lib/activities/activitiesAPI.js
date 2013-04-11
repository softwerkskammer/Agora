"use strict";

module.exports = function (conf) {

  var store = require('./activitystore')(conf);

  return {
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
      if (activity.isValid()) {
        store.saveActivity(activity, function (err) {
          if (err) {
            return callback(err);
          }
        });
      }
      callback(null, activity);
    }
  };
};

