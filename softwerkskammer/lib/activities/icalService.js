'use strict';

const icalendar = require('icalendar');

const beans = require('simple-configure').get('beans');
const misc = beans.get('misc');

function activityAsICal(activity) {
  const event = new icalendar.VEvent(activity.url());
  event.setSummary(activity.title());
  event.setDescription(activity.description().replace(/\r\n/g, '\n'));
  event.addProperty('LOCATION', activity.location().replace(/\r\n/g, '\n'));
  event.addProperty('URL', misc.toFullQualifiedUrl('activities', encodeURIComponent(activity.url())));
  event.setDate(activity.startDateTime().toJSDate(), activity.endDateTime().toJSDate());
  return event;
}

module.exports = {
  activityAsICal,

  icalForActivities: function (activities) {
    /* eslint new-cap: 0 */
    const ical = new icalendar.iCalendar();
    activities.forEach(activity => ical.addComponent(activityAsICal(activity)));
    return ical;
  }
};
