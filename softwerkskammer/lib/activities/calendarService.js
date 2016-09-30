'use strict';

const beans = require('simple-configure').get('beans');

const activitystore = beans.get('activitystore');

module.exports = {

  eventsBetween: function eventsBetween(startMoment, endMoment, groupsColors, callback) {
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

    activitystore.allActivitiesByDateRangeInAscendingOrder(startMoment.unix(), endMoment.unix(), (err, activities) => {
      if (err) { return callback(err); }
      callback(null, activities.map(asCalendarEvent));
    });
  }

};
