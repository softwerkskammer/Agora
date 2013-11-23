"use strict";

var async = require('async');
var _ = require('underscore');

var beans = require('nconf').get('beans');

var activitiesCoreAPI = beans.get('activitiesCoreAPI');
var groupsAPI = beans.get('groupsAPI');
var membersAPI = beans.get('membersAPI');

module.exports = {
  getActivitiesForDisplay: function (activitiesFetcher, callback) {
    async.parallel(
      { activities: activitiesFetcher,
        groups: function (callback) { groupsAPI.getAllAvailableGroups(callback); },
        groupColors: function (callback) { groupsAPI.allGroupColors(callback); }
      },

      function (err, results) {
        if (err) { callback(err); }
        _.each(results.activities, function (activity) {
          activity.colorRGB = activity.colorFrom(results.groupColors);
        });
        _.each(results.activities, function (activity) {
          activity.group = activity.groupFrom(results.groups);
        });
        callback(null, results.activities);
      });
  },

  getActivityWithGroupAndParticipants: function (url, callback) {
    activitiesCoreAPI.getActivity(url, function (err, activity) {
      if (err || !activity) { return callback(err); }

      async.parallel({
          group: function (callback) { groupsAPI.getGroup(activity.assignedGroup(), callback); },
          members: function (callback) { membersAPI.getMembersForIds(activity.allRegisteredMembers(), callback); },
          owner: function (callback) { membersAPI.getMemberForId(activity.owner(), callback); }
        },

        function (err, results) {
          if (err) {return callback(err); }
          activity.group = results.group;
          activity.visitors = results.members;
          activity.ownerNickname = results.owner ? results.owner.nickname : undefined;
          callback(null, activity);
        });
    });

  }
};
