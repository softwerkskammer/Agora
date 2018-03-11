/*global emit */
'use strict';

const beans = require('simple-configure').get('beans');
const R = require('ramda');

const misc = beans.get('misc');
const moment = require('moment-timezone');

const logger = require('winston').loggers.get('transactions');
const persistence = beans.get('activitiesPersistence');
const Activity = beans.get('activity');
const SoCraTesActivity = beans.get('socratesActivity');

function toActivity(callback, err, jsobject) {
  if (jsobject && jsobject.isSoCraTes) {
    return misc.toObject(SoCraTesActivity, callback, err, jsobject);
  }
  return misc.toObject(Activity, callback, err, jsobject);
}

function toActivityList(callback, err, jsobjects) {
  if (err) { return callback(err); }
  callback(null, jsobjects.map(record => (record && record.isSoCraTes) ? new SoCraTesActivity(record) : new Activity(record)));
}

function allActivitiesByDateRange(rangeFrom, rangeTo, sortOrder, callback) {
  persistence.listByField({
    $and: [
      {endUnix: {$gt: rangeFrom}},
      {startUnix: {$lt: rangeTo}}
    ]
  }, sortOrder, R.partial(toActivityList, [callback]));
}

function allActivitiesByDateRangeInAscendingOrder(rangeFrom, rangeTo, callback) {
  allActivitiesByDateRange(rangeFrom, rangeTo, {startUnix: 1}, callback);
}

function allActivitiesByDateRangeInDescendingOrder(rangeFrom, rangeTo, callback) {
  allActivitiesByDateRange(rangeFrom, rangeTo, {startUnix: -1}, callback);
}

function flattenAndSortMongoResultCollection(collection) {
  return R.sortBy(R.prop('startUnix'), R.flatten(collection[0].value));
}

module.exports = {
  allActivities: function allActivities(callback) {
    persistence.list({startUnix: 1}, R.partial(toActivityList, [callback]));
  },

  allActivitiesByDateRangeInAscendingOrder,

  allActivitiesByDateRangeInDescendingOrder,

  upcomingActivities: function upcomingActivities(callback) {
    const start = moment().unix();
    const end = moment().add(10, 'years').unix();
    allActivitiesByDateRangeInAscendingOrder(start, end, callback);
  },

  pastActivities: function pastActivities(callback) {
    const start = 0;
    const end = moment().unix();
    allActivitiesByDateRangeInDescendingOrder(start, end, callback);
  },

  getActivity: function getActivity(url, callback) {
    persistence.getByField({url}, R.partial(toActivity, [callback]));
  },

  getActivityForId: function getActivityForId(id, callback) {
    persistence.getById(id, R.partial(toActivity, [callback]));
  },

  saveActivity: function saveActivity(activity, callback) {
    persistence.saveWithVersion(activity.state, callback);
  },

  removeActivity: function removeActivity(activity, callback) {
    persistence.remove(activity.id(), err => {
      logger.info('Activity removed:' + JSON.stringify(activity));
      callback(err);
    });
  },

  upcomingActivitiesForGroupIds: function upcomingActivitiesForGroupIds(groupIds, callback) {
    const start = moment().unix();

    persistence.listByField({
      $and: [
        {endUnix: {$gt: start}},
        {assignedGroup: {$in: groupIds}}
      ]
    }, {startUnix: 1}, R.partial(toActivityList, [callback]));
  },

  pastActivitiesForGroupIds: function pastActivitiesForGroupIds(groupIds, callback) {
    const start = moment().unix();

    persistence.listByField({
      $and: [
        {endUnix: {$lt: start}},
        {assignedGroup: {$in: groupIds}}
      ]
    }, {startUnix: -1}, R.partial(toActivityList, [callback]));
  },

  activitiesForGroupIdsAndRegisteredMemberId: function activitiesForGroupIdsAndRegisteredMemberId(groupIds, memberId, upcoming, callback) {
    function map() {
      /* eslint no-underscore-dangle: 0 */
      const activity = this; // "this" holds the activity that is currently being examined

      // is the assigned group in the list of groups?
      if (groupIds.indexOf(activity.assignedGroup) > -1) {
        emit(memberId, activity);
      } else { // only try this if the first one failed -> otherwise we get duplicate entries!

        // is the member registered in one of the resources?
        for (var resource in activity.resources) {
          if (activity.resources.hasOwnProperty(resource) && activity.resources[resource]._registeredMembers) {
            const memberIsRegistered = activity.resources[resource]._registeredMembers.some(
              function (mem) { return mem.memberId === memberId; }
            );
            if (memberIsRegistered) {
              emit(memberId, activity);
              return;
            } // we only want to add the activity once
          }
        }
      }
    }

    function reduce(key, values) {
      return values;
    }

    const now = moment().unix();
    const query = upcoming ? {endUnix: {$gt: now}} : {endUnix: {$lt: now}};
    const parameters = {out: {inline: 1}, scope: {memberId, groupIds}, query, jsMode: true};

    persistence.mapReduce(map, reduce, parameters, (err, collection) => {
      if (err) { return callback(err); }
      if (!collection || collection.length === 0) {
        return callback(null, []);
      }
      // when there are many results, the value will be a nested array, so we need to flatten it:
      const results = flattenAndSortMongoResultCollection(collection);
      return toActivityList(callback, null, !upcoming ? results.reverse() : results);
    });
  },

  flattenAndSortMongoResultCollection
};
