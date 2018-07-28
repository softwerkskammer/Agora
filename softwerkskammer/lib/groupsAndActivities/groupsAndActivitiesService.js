'use strict';

const async = require('async');
const request = require('request');

const conf = require('simple-configure');
const beans = conf.get('beans');
const groupstore = beans.get('groupstore');
const activitystore = beans.get('activitystore');
const Activity = beans.get('activity');
const fieldHelpers = beans.get('fieldHelpers');

function meetupFetchActivitiesURLFor(urlname) {
  return 'https://api.meetup.com/' + urlname + '/events';
}

module.exports = {
  cloneActivitiesFromMeetup: function cloneActivitiesFromMeetup(callback) {

    groupstore.getGroupsWithMeetupURL((err, groups) => {

      if (err) { return callback(err); }
      async.each(groups, (group, cb) => {
        request(meetupFetchActivitiesURLFor(group.meetupUrlName()), {json: true}, (err2, res, body) => {
          if (err2) {return cb(err2); }
          async.each(body, (meetup, cb2) => {

            const meetupDate = fieldHelpers.meetupDateToActivityTimes(meetup.local_date, meetup.local_time, meetup.duration);

            activitystore.saveActivity(new Activity().fillFromUI({
              url: 'meetup-' + meetup.id,
              title: meetup.name,
              description: meetup.description,
              assignedGroup: group.id,
              location: meetup.venue.name + ', ' + meetup.venue.address_1 + ', ' + meetup.venue.city,
              direction: '',
              startDate: meetupDate.startDate,
              startTime: meetupDate.startTime,
              endDate: meetupDate.endDate,
              endTime: meetupDate.endTime,
              meetupRSVPCount: meetup.yes_rsvp_count
            }), cb2);
          }, cb);
        });

      }, callback);
    });
  }
};
