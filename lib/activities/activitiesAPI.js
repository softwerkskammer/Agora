"use strict";

var conf = require('nconf');
var moment = require('moment');

var store = conf.get('beans').get('activitystore');
var validation = conf.get('beans').get('validation');
var fieldHelpers = conf.get('beans').get('fieldHelpers');

function checkActivityAndSave(activity, callback, api) {
  var errors = validation.isValidActivity(activity);
  if (errors.length !== 0) { return callback(false, errors); }
  api.saveActivity(activity, function (err, result) {
    if (err || !result) { return callback(false, []); }
    callback(true);
  });
}

module.exports = {
  getActivity: function (url, callback) {
    store.getActivity(url, callback);
  },

  allActivities: function (callback) {
    store.allActivities(callback);
  },

  upcomingActivities: function (callback) {
    var now = moment().unix();
    var until = moment().add('y', 10).unix();
    store.allActivitiesByDateRange(now, until, function (err, activities) {
      if (err) { return callback(err); }
      callback(null, activities);
    });
  },

  eventsBetween: function (startMoment, endMoment, groupsColors, allColors, callback) {
    store.allActivitiesByDateRange(startMoment.unix(), endMoment.unix(), function (err, activities) {
      if (err) { return callback(err); }
      callback(null, activities.map(function (activity) {
        return activity.asCalendarEvent(groupsColors, allColors);
      }));
    });
  },

  getActivityForId: function (id, callback) {
    store.getActivityForId(id, callback);
  },

  saveActivity: function (activity, callback) {
    if (!activity.id || activity.id === 'undefined') {
      activity.id = fieldHelpers.createLinkFrom([activity.assignedGroup, activity.title, activity.startDate]);
    }
    store.saveActivity(activity, function (err) {
      if (err) { return callback(err); }
      callback(null, activity);
    });
  },

  updateActivityFieldWith: function (id, field, value, callback) {
    var api = this;
    api.getActivityForId(id, function (err, activity) {
      if (field === 'url' && activity.url !== value) {
        api.isValidUrl(value, function (err, check) {
          if (err || !check) { return callback(false, ['Diese URL ist leider nicht verfügbar.']); }
          activity.url = value;
          checkActivityAndSave(activity, callback, api);
        });
      } else {
        activity[field] = value;
        checkActivityAndSave(activity, callback, api);
      }
    });
  },

  isValidUrl: function (url, callback) {
    var trimmedUrl = url.trim();
    if (this.isReserved(trimmedUrl)) { return callback(null, false); }
    this.getActivity(trimmedUrl, function (err, result) {
      if (err) { return callback(err); }
      callback(null, result === null);
    });
  },

  isReserved: function (url) {
    return new RegExp('^edit$|^new$|^checkurl$|^submit$|^administration$|\\+', 'i').test(url);
  }
};
