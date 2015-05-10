'use strict';

var beans = require('simple-configure').get('beans');

//var util = require('util');

var activitystore = beans.get('activitystore');

module.exports = {

  eventsBetween: function (startMoment, endMoment, groupsColors, callback) {
    function asCalendarEvent(activity) {
      return {
        start: activity.startMoment().format(),
        end: activity.endMoment().format(),
        url: activity.fullyQualifiedUrl(),
        title: activity.title(),
        className: 'verySmall',
        color: activity.colorFrom(groupsColors)
      };
    }

    activitystore.allActivitiesByDateRangeInAscendingOrder(startMoment.unix(), endMoment.unix(), function (err, activities) {
      if (err) { return callback(err); }
      callback(null, activities.map(function (activity) {
        return asCalendarEvent(activity);
      }));
    });
  }

};
