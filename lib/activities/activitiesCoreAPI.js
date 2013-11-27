"use strict";

var beans = require('nconf').get('beans');
var moment = require('moment-timezone');
var async = require('async');

var store = beans.get('activitystore');
var fieldHelpers = beans.get('fieldHelpers');
var waitinglistAPI = beans.get('waitinglistAPI');

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

  eventsBetween: function (startMoment, endMoment, groupsColors, callback) {
    store.allActivitiesByDateRangeInAscendingOrder(startMoment.unix(), endMoment.unix(), function (err, activities) {
      if (err) { return callback(err); }
      callback(null, activities.map(function (activity) {
        return activity.asCalendarEvent(groupsColors);
      }));
    });
  },

  activitiesBetween: function (startMoment, endMoment, callback) {
    if (typeof callback === 'undefined') {
      return function (callback) {
        store.allActivitiesByDateRangeInAscendingOrder(startMoment.unix(), endMoment.unix(), callWithActivities(callback));
      };
    }
    store.allActivitiesByDateRangeInAscendingOrder(startMoment.unix(), endMoment.unix(), callWithActivities(callback));
  },

  getActivityForId: function (id, callback) {
    store.getActivityForId(id, callback);
  },

  saveActivity: function (activity, callback) {
    if (!activity.id() || activity.id() === 'undefined') {
      activity.state.id = fieldHelpers.createLinkFrom([activity.assignedGroup(), activity.title(), activity.startDate()]);
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

  addVisitorTo: function (memberId, activityUrl, resourceName, moment, globalCallback) {
    var self = this;

    async.parallel({
        activity: function (callback) { self.getActivity(activityUrl, callback); },
        canSubscribe: function (callback) { waitinglistAPI.canSubscribe(memberId, activityUrl, resourceName, callback); }
      },
      function (err, results) {
        if (err) { return globalCallback(err); }

        if (results.activity.registrationOpenFor(resourceName) || results.canSubscribe) {
          results.activity.addMemberId(memberId, resourceName, moment);
          return self.saveActivity(results.activity, globalCallback);
        }
        return globalCallback(null, null, 'Die Anmeldung ist momentan nicht möglich.', 'Die Anmeldung ist noch nicht freigegeben, oder alle Plätze sind belegt.');
      });
  },

  removeVisitorFrom: function (memberId, url, resourceName, callback) {
    var self = this;
    self.getActivity(url, function (err, activity) {
      if (err) {return callback(err); }
      activity.removeMemberId(memberId, resourceName);
      self.saveActivity(activity, callback);
    });
  }

};
