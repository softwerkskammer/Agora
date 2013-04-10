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

    getActivityForId: function (id, callback) {
      store.getActivityForId(id, callback);
    },

    saveActivity: function (activity, callback) {
      if (activity.isValid()) {
        console.log('activity is valid');
        store.saveActivity(activity, function (err) {
          if (err) {
            console.log('err in api: ', err);
            return callback(err);
          }
        });
      }
      callback(null, activity);
    }
  };
};

