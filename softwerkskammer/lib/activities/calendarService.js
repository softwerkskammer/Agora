"use strict";
const activitystore = require("./activitystore");

module.exports = {
  eventsBetween: function eventsBetween(startMillis, endMillis, groupsColors) {
    function asCalendarEvent(activity) {
      return {
        start: activity.startDateTime().toString(),
        end: activity.endDateTime().toString(),
        url: activity.fullyQualifiedUrl(),
        title: activity.title(),
        className: "verySmall",
        color: activity.colorFrom(groupsColors),
      };
    }

    const activities = activitystore.allActivitiesByDateRangeInAscendingOrder(startMillis, endMillis);
    return activities.map(asCalendarEvent);
  },
};
