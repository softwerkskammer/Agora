"use strict";

var conf = require('nconf');
var moment = require('moment-timezone');

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

function nowIfUndefined(date) {
  return date || moment();
}

var callWithActivities = function (callback) {
  return function (err, activities) {
    if (err) { return callback(err); }
    callback(null, activities);
  };
};

module.exports = {
  getActivity: function (url, callback) {
    store.getActivity(url, callback);
  },

  allActivities: function (callback) {
    store.allActivities(callback);
  },

  upcomingActivities: function (callback, now) {
    var definedNow = nowIfUndefined(now);
    var start = definedNow.unix();
    var end = definedNow.add('y', 10).unix();
    store.allActivitiesByDateRangeInAscendingOrder(start, end, callWithActivities(callback));
  },

  pastActivities: function (callback, now) {
    var definedNow = nowIfUndefined(now);
    var start = 0;
    var end = definedNow.unix();
    store.allActivitiesByDateRangeInDescendingOrder(start, end, callWithActivities(callback));
  },

  eventsBetween: function (startMoment, endMoment, groupsColors, allColors, callback) {
    store.allActivitiesByDateRangeInAscendingOrder(startMoment.unix(), endMoment.unix(), function (err, activities) {
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
      activity.id = fieldHelpers.createLinkFrom([activity.assignedGroup, activity.title, activity.startDate()]);
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
        if (field === 'startDate') {
          activity.updateStartDateWith(value);
        } else if (field === 'startTime') {
          activity.updateStartTimeWith(value);
        } else if (field === 'endDate') {
          activity.updateEndDateWith(value);
        } else if (field === 'endTime') {
          activity.updateEndTimeWith(value);
        } else {
          activity[field] = value;
        }
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
  },

  addVisitorTo: function (memberId, url, callback) {
    var self = this;
    self.getActivity(url, function (err, activity) {
      if (err) {return err; }
      activity.addMemberId(memberId);
      self.saveActivity(activity, callback);
    });
  },

  removeVisitorFrom: function (memberId, url, callback) {
    var self = this;
    self.getActivity(url, function (err, activity) {
      if (err) {return err; }
      activity.removeMemberId(memberId);
      self.saveActivity(activity, callback);
    });
  }

};
