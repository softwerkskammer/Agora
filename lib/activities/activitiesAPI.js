"use strict";

var async = require('async');
var _ = require('underscore');

var beans = require('nconf').get('beans');

var groupsAPI = beans.get('groupsAPI');
var colorsAPI = beans.get('colorAPI');

module.exports = {
  getActivitiesForDisplay: function (activitiesFetcher, callback) {
    async.parallel(
      { activities: activitiesFetcher,
        groups: function (callback) { groupsAPI.getAllAvailableGroups(callback); },
        colors: function (callback) { colorsAPI.allColors(callback); },
        groupColors: function (callback) { groupsAPI.allColors(callback); }
      },

      function (err, results) {
        if (err) { callback(err); }
        _.each(results.activities, function (activity) {
          activity.colorRGB = activity.colorFrom(results.groupColors, results.colors);
        });
        _.each(results.activities, function (activity) {
          activity.groupName = activity.groupNameFrom(results.groups);
        });
        callback(null, results.activities);
      });
  }
};
