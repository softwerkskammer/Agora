'use strict';

var _ = require('underscore');

require('./configure'); // initializing parameters
var beans = require('nconf').get('beans');
var activitiesCoreAPI = beans.get('activitiesCoreAPI');

var async = require('async');

var really = process.argv[2];

if (!really || really !== 'really') {
  console.log('If you really want to migrate the db, append "really" to the command line.');
  process.exit();
}

function logResult(err, message) {
  if (err) { return console.log('An error occurred: ' + err); }
  console.log(message);
}

activitiesCoreAPI.allActivities(function (err, activities) {
  if (err) { return console.log("Error: " + err); }
  if (!activities) { return console.log("No activities found!"); }
  _.each(activities, function (activity) {
    delete activity.state.color;
    _.each(activity.state.resources, function (resource) {
      resource._registrationOpen = true;
    });
  });

  async.map(activities, activitiesCoreAPI.saveActivity, function (err, results) {
    logResult(err, "All Activities were migrated: " + results);
    process.exit();
  });
});
