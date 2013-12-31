"use strict";

var beans = require('nconf').get('beans');

//var util = require('util');

var activitystore = beans.get('activitystore');

module.exports = {

  eventsBetween: function (startMoment, endMoment, groupsColors, callback) {
    activitystore.allActivitiesByDateRangeInAscendingOrder(startMoment.unix(), endMoment.unix(), function (err, activities) {
      if (err) { return callback(err); }
      callback(null, activities.map(function (activity) {
        return activity.asCalendarEvent(groupsColors);
      }));
    });
  }

};
