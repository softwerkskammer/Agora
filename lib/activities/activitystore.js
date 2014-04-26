"use strict";
var conf = require('nconf');
var _ = require('lodash');
var moment = require('moment-timezone');

var persistence = conf.get('beans').get('activitiesPersistence');
var Activity = conf.get('beans').get('activity');

var toActivity = function (callback, err, activity) {
  if (err) { return callback(err); }
  if (activity) { return callback(null, new Activity(activity)); }
  callback(null, null);
};

var toActivityList = function (callback, err, activities) {
  if (err) { return callback(err); }
  callback(null, _.map(activities, function (activity) {
    return new Activity(activity);
  }));
};

var allActivitiesByDateRange = function (rangeFrom, rangeTo, sortOrder, callback) {
  persistence.listByField({ $and: [
    {endUnix: { $gt: rangeFrom }},
    {endUnix: { $lt: rangeTo }}
  ]}, sortOrder, _.partial(toActivityList, callback));
};

var allActivitiesByDateRangeInAscendingOrder = function (rangeFrom, rangeTo, callback) {
  allActivitiesByDateRange(rangeFrom, rangeTo, {startUnix: 1}, callback);
};

var allActivitiesByDateRangeInDescendingOrder = function (rangeFrom, rangeTo, callback) {
  allActivitiesByDateRange(rangeFrom, rangeTo, {startUnix: -1}, callback);
};


module.exports = {
  allActivities: function (callback) {
    persistence.list({startUnix: 1}, _.partial(toActivityList, callback));
  },

  allActivitiesByDateRangeInAscendingOrder: allActivitiesByDateRangeInAscendingOrder,

  allActivitiesByDateRangeInDescendingOrder: allActivitiesByDateRangeInDescendingOrder,

  upcomingActivities: function (callback) {
    var start = moment().unix();
    var end = moment().add('years', 10).unix();
    allActivitiesByDateRangeInAscendingOrder(start, end, callback);
  },

  pastActivities: function (callback) {
    var start = 0;
    var end = moment().unix();
    allActivitiesByDateRangeInDescendingOrder(start, end, callback);
  },

  getActivity: function (url, callback) {
    persistence.getByField({url: url}, _.partial(toActivity, callback));
  },

  getActivityForId: function (id, callback) {
    persistence.getById(id, _.partial(toActivity, callback));
  },

  saveActivity: function (activity, callback) {
    persistence.saveWithVersion(activity.state, callback);
  },

  upcomingActivitiesForGroupIds: function (groupIds, callback) {
    var start = moment().unix();

    persistence.listByField({ $and: [
      {endUnix: { $gt: start }},
      {$or: [
        {assignedGroup: { $in: groupIds }}
      ]}
    ]}, {startUnix: 1}, _.partial(toActivityList, callback));
  },

  upcomingActivitiesForGroupIdsAndMemberId: function (groupIds, memberId, callback) {
    var start = moment().unix();

    var map = function () {
      var self = this;

      // is the assigned group in the list of groups?
      if (groupIds.indexOf(self.assignedGroup) > -1) {
        emit(memberId, self);
      } else { // only try this if the first one failed -> otherwise we get duplicate entries!

        // is the member registered in one of the resources?
        var resource;
        for (resource in self.resources) {
          self.resources[resource]._registeredMembers.forEach(function (elem) {
            if (elem === memberId) {
              emit(memberId, self);
            }
          });
        }
      }

    };

    var reduce = function (key, values) {
      return values;
    };

    var parameters = {out: {inline: 1}, scope: {memberId: memberId, groupIds: groupIds}, query: {endUnix: { $gt: start }}, jsMode: true};

    persistence.mapReduce(map, reduce, parameters, function (err, collection) {
      if (err || !collection || collection.length === 0) { return callback(err); }
      //     return callback(null, collection);
      return toActivityList(callback, null, _.sortBy(collection[0].value, 'startUnix'));
    });
  }
};
