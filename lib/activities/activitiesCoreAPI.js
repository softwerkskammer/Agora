"use strict";

var conf = require('nconf');
var moment = require('moment-timezone');

var store = conf.get('beans').get('activitystore');
var fieldHelpers = conf.get('beans').get('fieldHelpers');

function nowIfUndefined(now) {
  return typeof now !== 'undefined' ? now : moment();
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

  addVisitorTo: function (memberId, url, resource, callback) {
    var self = this;
    self.getActivity(url, function (err, activity) {
      if (err) {return err; }
      activity.addMemberId(memberId, resource);
      self.saveActivity(activity, callback);
    });
  },

  removeVisitorFrom: function (memberId, url, resource, callback) {
    var self = this;
    self.getActivity(url, function (err, activity) {
      if (err) {return err; }
      activity.removeMemberId(memberId, resource);
      self.saveActivity(activity, callback);
    });
  }

};
