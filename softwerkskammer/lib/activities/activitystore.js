/*global emit */
'use strict';

var beans = require('simple-configure').get('beans');
var _ = require('lodash');
var misc = beans.get('misc');
var moment = require('moment-timezone');

var logger = require('winston').loggers.get('transactions');
var persistence = beans.get('activitiesPersistence');
var Activity = beans.get('activity');
var SoCraTesActivity = beans.get('socratesActivity');

var toActivity = function (callback, err, jsobject) {
  if (jsobject && jsobject.isSoCraTes) {
    return misc.toObject(SoCraTesActivity, callback, err, jsobject);
  }
  return misc.toObject(Activity, callback, err, jsobject);
};

var toActivityList = function (callback, err, jsobjects) {
  if (err) { return callback(err); }
  callback(null, _.map(jsobjects, function (each) {
    if (each && each.isSoCraTes) {
      return new SoCraTesActivity(each);
    }
    return new Activity(each);
  }));
};

var allActivitiesByDateRange = function (rangeFrom, rangeTo, sortOrder, callback) {
  persistence.listByField({
    $and: [
      {endUnix: {$gt: rangeFrom}},
      {endUnix: {$lt: rangeTo}}
    ]
  }, sortOrder, _.partial(toActivityList, callback));
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
    var end = moment().add(10, 'years').unix();
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

  removeActivity: function (activity, callback) {
    persistence.remove(activity.id(), function (err) {
      logger.info('Activity removed:' + JSON.stringify(activity));
      callback(err);
    });
  },

  upcomingActivitiesForGroupIds: function (groupIds, callback) {
    var start = moment().unix();

    persistence.listByField({
      $and: [
        {endUnix: {$gt: start}},
        {assignedGroup: {$in: groupIds}}
      ]
    }, {startUnix: 1}, _.partial(toActivityList, callback));
  },

  activitiesForGroupIdsAndRegisteredMemberId: function (groupIds, memberId, upcoming, callback) {
    var map = function () {
      /* eslint no-underscore-dangle: 0 */
      var self = this; // "this" holds the activity that is currently being examined

      // is the assigned group in the list of groups?
      if (groupIds.indexOf(self.assignedGroup) > -1) {
        emit(memberId, self);
      } else { // only try this if the first one failed -> otherwise we get duplicate entries!

        // is the member registered in one of the resources?
        var memberIsRegistered = false;
        var checkMemberId = function (elem) {
          if (elem.memberId === memberId) {
            emit(memberId, self);
            memberIsRegistered = true;
          }
        };
        var resource;
        for (resource in self.resources) {
          if (self.resources.hasOwnProperty(resource) && self.resources[resource]._registeredMembers) {
            self.resources[resource]._registeredMembers.forEach(checkMemberId);
            if (memberIsRegistered) { return; } // we only want to add the activity once
          }
        }
      }
    };

    var reduce = function (key, values) {
      return values;
    };

    var now = moment().unix();
    var query = upcoming ? {endUnix: {$gt: now}} : {endUnix: {$lt: now}};
    var parameters = {out: {inline: 1}, scope: {memberId: memberId, groupIds: groupIds}, query: query, jsMode: true};

    persistence.mapReduce(map, reduce, parameters, function (err, collection) {
      if (err && err.errmsg === 'ns doesn\'t exist') { return callback(null, []); } // no mongostore available -> nevermind
      if (err) { return callback(err); }
      if (!collection || collection.length === 0) {
        return callback(null, []);
      }
      // when there are many results, the value will be a nested array, so we need to flatten it:
      var results = _.sortBy(_.flatten(collection[0].value), 'startUnix');
      if (!upcoming) {
        results = results.reverse();
      }
      return toActivityList(callback, null, results);
    });
  }
};
