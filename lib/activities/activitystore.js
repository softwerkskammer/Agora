"use strict";

var activitystore;

module.exports = function (conf) {
  if (!activitystore) {
    var persistence = require('../persistence/persistence')('activitystore', conf);
    var async = require('async');
    var Activity = require('./activity');

    var toActivity = function (callback, err, result) {
      if (err) {
        return callback(err);
      }
      if (result) {
        return callback(null, new Activity().fromObject(result));
      }
      callback(null, null);
    };

    var toActivityList = function (callback, err, result) {
      if (err) {
        return callback(err);
      }
      async.map(result, function (each, cb) {
        cb(null, new Activity().fromObject(each));
      }, callback);
    };

    activitystore = {
      allActivities    : function (callback) {
        persistence.list(async.apply(toActivityList, callback));
      },
      getActivity     : function (id, callback) {
        persistence.getByField({id: id}, async.apply(toActivity, callback));
      },
      getActivityForId: function (id, callback) {
        persistence.getById(id, async.apply(toActivity, callback));
      },
      saveActivity    : function (activity, callback) {
        persistence.save(activity, callback);
      }
    };
  }
  return activitystore;

};


