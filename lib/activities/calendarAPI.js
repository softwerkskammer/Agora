"use strict";

var beans = require('nconf').get('beans');

//var util = require('util');

var activitystore = beans.get('activitystore');

module.exports = {

  eventsBetween: function (startMoment, endMoment, groupsColors, callback) {
    var self = this;
    activitystore.allActivitiesByDateRangeInAscendingOrder(startMoment.unix(), endMoment.unix(), function (err, activities) {
      if (err) { return callback(err); }
      callback(null, activities.map(function (activity) {
        return self.asCalendarEvent(activity, groupsColors);
      }));
    });
  },

  asCalendarEvent: function (activity, groupsColors) {
    return {
      start: activity.startUnix(),
      end: activity.endUnix(),
      url: '/activities/' + encodeURIComponent(activity.url()),
      title: activity.title(),
      startTime: activity.startMoment().format('HH:mm'),
      className: 'verySmall',
      dayOfWeek: activity.startMoment().day(),
      color: activity.colorFrom(groupsColors)
    };
  }

};
