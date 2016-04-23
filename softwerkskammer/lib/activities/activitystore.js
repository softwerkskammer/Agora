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

function toActivity(callback, err, jsobject) {
  if (jsobject && jsobject.isSoCraTes) {
    return misc.toObject(SoCraTesActivity, callback, err, jsobject);
  }
  return misc.toObject(Activity, callback, err, jsobject);
}

function toActivityList(callback, err, jsobjects) {
  if (err) { return callback(err); }
  callback(null, _.map(jsobjects, function (each) {
    if (each && each.isSoCraTes) {
      return new SoCraTesActivity(each);
    }
    return new Activity(each);
  }));
}

function allActivitiesByDateRange(rangeFrom, rangeTo, sortOrder, callback) {
  persistence.listByField({
    $and: [
      {endUnix: {$gt: rangeFrom}},
      {startUnix: {$lt: rangeTo}}
    ]
  }, sortOrder, _.partial(toActivityList, callback));
}

function allActivitiesByDateRangeInAscendingOrder(rangeFrom, rangeTo, callback) {
  allActivitiesByDateRange(rangeFrom, rangeTo, {startUnix: 1}, callback);
}

function allActivitiesByDateRangeInDescendingOrder(rangeFrom, rangeTo, callback) {
  allActivitiesByDateRange(rangeFrom, rangeTo, {startUnix: -1}, callback);
}

function flattenAndSortMongoResultCollection(collection) {
  return _.sortBy(_.flattenDeep(collection[0].value), 'startUnix');
}

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
      var activity = this; // "this" holds the activity that is currently being examined

      // is the assigned group in the list of groups?
      if (groupIds.indexOf(activity.assignedGroup) > -1) {
        emit(memberId, activity);
      } else { // only try this if the first one failed -> otherwise we get duplicate entries!

        // is the member registered in one of the resources?
        var memberIsRegistered = false;
        var checkMemberId = function (elem) {
          if (elem.memberId === memberId) {
            emit(memberId, activity);
            memberIsRegistered = true;
          }
        };
        var resource;
        for (resource in activity.resources) {
          if (activity.resources.hasOwnProperty(resource) && activity.resources[resource]._registeredMembers) {
            activity.resources[resource]._registeredMembers.forEach(checkMemberId);
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
      var results = flattenAndSortMongoResultCollection(collection);
      if (!upcoming) {
        results = results.reverse();
      }
      return toActivityList(callback, null, results);
    });
  },

  flattenAndSortMongoResultCollection: flattenAndSortMongoResultCollection
};
