const beans = require("simple-configure").get("beans");

const activitystore = beans.get("activitystore");

module.exports = {
  eventsBetween: async function eventsBetween(startMillis, endMillis, groupsColors) {
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

    const activities = await activitystore.allActivitiesByDateRangeInAscendingOrder(startMillis, endMillis);
    return activities.map(asCalendarEvent);
  },
};
