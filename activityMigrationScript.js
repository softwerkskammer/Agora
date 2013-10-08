'use strict';

require('./configure'); // initializing parameters
var async = require('async');

var beans = require('nconf').get('beans');
var fieldHelpers = beans.get('fieldHelpers');
var persistence = beans.get('activitiesPersistence');
var Activity = beans.get('activity');

function logResult(err, message) {
  if (err) { return console.log('An error occurred: ' + err); }
  console.log(message);
}

console.log('Migrating all existing activities...');
persistence.list({}, function (err, activities) {
  async.map(activities, function (activityObject, callback) {
    var activity = new Activity(activityObject);
    var momentInLocalTimezone = fieldHelpers._toMomentInTimezone(activity.startMoment().utc(), fieldHelpers.defaultTimezone());
    activityObject.startUnix = momentInLocalTimezone.unix(); // the db object must be updated (not the new activity)
    momentInLocalTimezone = fieldHelpers._toMomentInTimezone(activity.endMoment().utc(), fieldHelpers.defaultTimezone());
    activityObject.endUnix = momentInLocalTimezone.unix(); // the db object must be updated (not the new activity)
    callback(null, activityObject);
  }, function (err, results) {
    persistence.saveAll(results, function (err) {
      logResult(err, 'All existing activities are now migrated.');
      process.exit();
    });
  });
});
