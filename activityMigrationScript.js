'use strict';

require('./configure'); // initializing parameters
var _ = require('underscore');

var conf = require('nconf');

var beans = conf.get('beans');
var fieldHelpers = beans.get('fieldHelpers');
var persistence = beans.get('activitiesPersistence');
var Activity = beans.get('activity');



function logResult(err, message) {
  if (err) {
    console.log('An error occurred: ' + err);
  } else {
    console.log(message);
  }
}

console.log('Migrating all existing activities...');
persistence.list({}, function (err, activities) {
  _.each(activities, function (activityObject) {
    var activity = new Activity(activityObject);
    var momentInLocalTimezone = fieldHelpers._toMomentInTimezone(activity.startMoment().utc(), fieldHelpers.defaultTimezone());
    activityObject.startUnix = momentInLocalTimezone.unix(); // the db object must be updated (not the new activity)
    momentInLocalTimezone = fieldHelpers._toMomentInTimezone(activity.endMoment().utc(), fieldHelpers.defaultTimezone());
    activityObject.endUnix = momentInLocalTimezone.unix(); // the db object must be updated (not the new activity)
  });
  persistence.saveAll(activities, function (err) {
    logResult(err, 'All existing activities are now migrated.');
  });
});
