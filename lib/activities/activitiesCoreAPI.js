"use strict";

var beans = require('nconf').get('beans');

//var util = require('util');

var store = beans.get('activitystore');

module.exports = {
  eventsBetween: function (startMoment, endMoment, groupsColors, callback) {
    store.allActivitiesByDateRangeInAscendingOrder(startMoment.unix(), endMoment.unix(), function (err, activities) {
      if (err) { return callback(err); }
      callback(null, activities.map(function (activity) {
        return activity.asCalendarEvent(groupsColors);
      }));
    });
  }

};
