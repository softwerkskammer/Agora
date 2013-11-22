"use strict";

var async = require('async');
var _ = require('underscore');

var beans = require('nconf').get('beans');

var activitiesCoreAPI = beans.get('activitiesCoreAPI');
var groupsAPI = beans.get('groupsAPI');
var colorsAPI = beans.get('colorAPI');
var membersAPI = beans.get('membersAPI');

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
  },

  getActivityWithGroupAndParticipants: function (url, callback) {
    activitiesCoreAPI.getActivity(url, function (err, activity) {
      if (err || !activity) { return callback(err); }

      async.parallel({
          group: function (callback) { groupsAPI.getGroup(activity.assignedGroup(), callback); },
          members: function (callback) { membersAPI.getMembersForIds(activity.allRegisteredMembers(), callback); }
        },

        function (err, results) {
          if (err) {return callback(err); }
          activity.group = results.group;
          activity.visitors = results.members;
          callback(null, activity);
        });
    });

  }
};
