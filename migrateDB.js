'use strict';

require('./configure'); // initializing parameters
var _ = require('underscore');
var async = require('async');
var moment = require('moment-timezone');
var beans = require('nconf').get('beans');
var persistence = beans.get('waitinglistPersistence');
var activitystore = beans.get('activitystore');

var async = require('async');

var really = process.argv[2];

if (!really || really !== 'really') {
  console.log('If you really want to migrate the db, append "really" to the command line.');
  process.exit();
}

activitystore.allActivities(function (err, activities) {

  persistence.list({startUnix: 1}, function (err, results) {
    async.each(results, function (each, callback) {
        var activity = _.find(activities, function (activity) { return activity.id() === each._activityId; });
        if (!activity) { return callback(); }
        var resource = activity.resourceNamed(each._resourceName);
        if (resource.state._withWaitinglist && !resource.state._waitinglist) { resource.state._waitinglist = []; }
        resource.addToWaitinglist(each._registrantId, moment(each._registrationDate));
        activitystore.saveActivity(activity, callback);
      },
      function (err) {
        if (err) {
          console.log(err);
          process.exit();
        }
      });
    process.exit();
  });

});


