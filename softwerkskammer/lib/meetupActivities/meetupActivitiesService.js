const async = require("async");
const request = require("request");

const conf = require("simple-configure");
const beans = conf.get("beans");
const groupstore = beans.get("groupstore");
const activitystore = beans.get("activitystore");
const Activity = beans.get("activity");
const fieldHelpers = beans.get("fieldHelpers");

function meetupFetchActivitiesURLFor(urlname) {
  // v3 API https://www.meetup.com/de-DE/meetup_api/docs/:urlname/events/
  return "https://api.meetup.com/" + urlname + "/events";
}

module.exports = {
  cloneActivitiesFromMeetupForGroup: function cloneActivitiesFromMeetupForGroup(group, callback) {
    request(meetupFetchActivitiesURLFor(group.meetupUrlName()), { json: true }, (err, res, body) => {
      if (err) {
        return callback(err);
      }
      async.each(
        body,
        async (meetup, cb) => {
          const meetupDate = fieldHelpers.meetupDateToActivityTimes(
            meetup.local_date,
            meetup.local_time,
            meetup.duration
          );
          const activityUrl = "meetup-" + meetup.id;

          try {
            const persistentActivity = await activitystore.getActivity(activityUrl);
            const activity = persistentActivity || new Activity();

            await activitystore.saveActivity(
              activity.fillFromUI({
                url: activityUrl,
                title: meetup.name,
                description: meetup.description,
                assignedGroup: group.id,
                location: meetup.venue
                  ? meetup.venue.name + ", " + meetup.venue.address_1 + ", " + meetup.venue.city
                  : "",
                direction: "",
                startDate: meetupDate.startDate,
                startTime: meetupDate.startTime,
                endDate: meetupDate.endDate,
                endTime: meetupDate.endTime,
                clonedFromMeetup: true,
                meetupRSVPCount: meetup.yes_rsvp_count,
              })
            ); // saveActivity
            cb();
          } catch (e) {
            return cb(e);
          }
        },
        callback
      ); // async.each (body)
    });
  },

  cloneActivitiesFromMeetup: async function cloneActivitiesFromMeetup(callback) {
    try {
      const groups = await groupstore.getGroupsWithMeetupURL();
      async.each(groups, this.cloneActivitiesFromMeetupForGroup, callback);
    } catch (e) {
      callback(e);
    }
  },
};
