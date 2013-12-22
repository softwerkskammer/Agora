"use strict";

var beans = require('nconf').get('beans');

//var util = require('util');

var store = beans.get('activitystore');
var fieldHelpers = beans.get('fieldHelpers');

var callWithActivities = function (callback) {
  return function (err, activities) {
    if (err) { return callback(err); }
    callback(null, activities);
  };
};

module.exports = {
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

  saveActivity: function (activity, callback) {
    if (!activity.id() || activity.id() === 'undefined') {
      activity.state.id = fieldHelpers.createLinkFrom([activity.assignedGroup(), activity.title(), activity.startMoment()]);
    }
    store.saveActivity(activity, callback);
  },

  isValidUrl: function (url, callback) {
    var trimmedUrl = url.trim();
    if (this.isReserved(trimmedUrl)) { return callback(null, false); }
    store.getActivity(trimmedUrl, function (err, result) {
      if (err) { return callback(err); }
      callback(null, result === null);
    });
  },

  isReserved: function (url) {
    return new RegExp('^edit$|^new$|^checkurl$|^submit$|^administration$|\\+', 'i').test(url);
  },

  addVisitorTo: function (memberId, activityUrl, resourceName, moment, callback) {
    var self = this;
    store.getActivity(activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      var resource = activity.resourceNamed(resourceName);
      var waitinglistEntry = resource.waitinglistEntryFor(memberId);
      var canSubscribe = waitinglistEntry ? waitinglistEntry.canSubscribe() : false;
      if (resource.isRegistrationOpen() || canSubscribe) {
        resource.addMemberId(memberId, moment);
        return self.saveActivity(activity, callback);
      }
      return callback(null, "activities.registration_not_now", "activities.registration_not_possible");
    });
  },

  removeVisitorFrom: function (memberId, url, resourceName, callback) {
    var self = this;
    store.getActivity(url, function (err, activity) {
      if (err) {return callback(err); }
      activity.resourceNamed(resourceName).removeMemberId(memberId);
      self.saveActivity(activity, callback);
    });
  },

  addToWaitinglist: function (memberId, activityUrl, resourceName, moment, callback) {
    var self = this;
    store.getActivity(activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      var resource = activity.resourceNamed(resourceName);
      if (resource.hasWaitinglist()) {
        resource.addToWaitinglist(memberId, moment);
        return self.saveActivity(activity, callback);
      }
      return callback(null, "activities.waitinglist_not_possible", "activities.no_waitinglist");
    });
  },

  removeFromWaitinglist: function (memberId, activityUrl, resourceName, callback) {
    var self = this;
    store.getActivity(activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      var resource = activity.resourceNamed(resourceName);
      resource.removeFromWaitinglist(memberId);
      return self.saveActivity(activity, callback);
    });
  }

};
