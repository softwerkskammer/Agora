"use strict";
const superagent = require("superagent");

const groupstore = require("../groups/groupstore");
const activitystore = require("../activities/activitystore");
const Activity = require("../activities/activity");
const fieldHelpers = require("../commons/fieldHelpers");

function meetupFetchActivitiesURLFor(urlname) {
  // v3 API https://www.meetup.com/de-DE/meetup_api/docs/:urlname/events/
  return `https://api.meetup.com/${urlname}/events`;
}

module.exports = {
  cloneActivitiesFromMeetupForGroup: async function cloneActivitiesFromMeetupForGroup(group) {
    const { body } = await superagent.get(meetupFetchActivitiesURLFor(group.meetupUrlName())).set("accept", "json");

    const all = body.map(async (meetup) => {
      const meetupDate = fieldHelpers.meetupDateToActivityTimes(meetup.local_date, meetup.local_time, meetup.duration);
      const activityUrl = `meetup-${meetup.id}`;

      const persistentActivity = activitystore.getActivity(activityUrl);
      const activity = persistentActivity || new Activity();

      return activitystore.saveActivity(
        activity.fillFromUI({
          url: activityUrl,
          title: meetup.name,
          description: meetup.description,
          assignedGroup: group.id,
          location: meetup.venue ? `${meetup.venue.name}, ${meetup.venue.address_1}, ${meetup.venue.city}` : "",
          direction: "",
          startDate: meetupDate.startDate,
          startTime: meetupDate.startTime,
          endDate: meetupDate.endDate,
          endTime: meetupDate.endTime,
          clonedFromMeetup: true,
          meetupRSVPCount: meetup.yes_rsvp_count,
        }),
      ); // saveActivity
    });
    return Promise.all(all);
  },

  cloneActivitiesFromMeetup: async function cloneActivitiesFromMeetup() {
    const groups = groupstore.getGroupsWithMeetupURL();
    return Promise.all(groups.map(async (group) => this.cloneActivitiesFromMeetupForGroup(group)));
  },
};
