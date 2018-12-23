const beans = require('simple-configure').get('beans');

const activitystore = beans.get('activitystore');

module.exports = {

  eventsBetween: function eventsBetween(startMillis, endMillis, groupsColors, callback) {
    function asCalendarEvent(activity) {
      return {
        start: activity.startDateTime().toString(),
        end: activity.endDateTime().toString(),
        url: activity.fullyQualifiedUrl(),
        title: activity.title(),
        className: 'verySmall',
        color: activity.colorFrom(groupsColors)
      };
    }

    activitystore.allActivitiesByDateRangeInAscendingOrder(startMillis, endMillis, (err, activities) => {
      if (err) { return callback(err); }
      callback(null, activities.map(asCalendarEvent));
    });
  }

};
