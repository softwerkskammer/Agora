'use strict';

var async = require('async');
var _ = require('lodash');

var conf = require('nconf');
var beans = conf.get('beans');

var activitystore = beans.get('activitystore');
var groupsService = beans.get('groupsService');
var groupstore = beans.get('groupstore');
var memberstore = beans.get('memberstore');
var notifications = beans.get('notifications');
var CONFLICTING_VERSIONS = beans.get('constants').CONFLICTING_VERSIONS;

module.exports = {
  getActivitiesForDisplay: function (activitiesFetcher, callback) {
    async.parallel(
      {
        activities: activitiesFetcher,
        groups: function (callback) { groupsService.getAllAvailableGroups(callback); },
        groupColors: function (callback) { groupsService.allGroupColors(callback); }
      },

      function (err, results) {
        if (err) { callback(err); }
        _.each(results.activities, function (activity) {
          activity.colorRGB = activity.colorFrom(results.groupColors);
        });
        _.each(results.activities, function (activity) {
          activity.groupFrom(results.groups); // sets the group object in activity
        });
        callback(null, results.activities);
      }
    );
  },

  getUpcomingActivitiesOfMemberAndHisGroups: function (member, callback) {
    var activitiesFetcher = function (member) {
      var groupIds = _.pluck(member.subscribedGroups, 'id');
      return _.partial(activitystore.activitiesForGroupIdsAndRegisteredMemberId, groupIds, member.id(), true);
    };

    return this.getActivitiesForDisplay(activitiesFetcher(member), callback);
  },

  getPastActivitiesOfMember: function (member, callback) {
    var activitiesFetcher = function (member) {
      return _.partial(activitystore.activitiesForGroupIdsAndRegisteredMemberId, [], member.id(), false);
    };

    return this.getActivitiesForDisplay(activitiesFetcher(member), callback);
  },

  getActivityWithGroupAndParticipants: function (url, callback) {
    activitystore.getActivity(url, function (err, activity) {
      if (err || !activity) { return callback(err); }

      async.parallel(
        {
          group: function (callback) { groupstore.getGroup(activity.assignedGroup(), callback); },
          participants: function (callback) { memberstore.getMembersForIds(activity.allRegisteredMembers(), callback); },
          owner: function (callback) { memberstore.getMemberForId(activity.owner(), callback); }
        },

        function (err, results) {
          if (err) {return callback(err); }
          activity.group = results.group;
          activity.participants = results.participants;
          activity.ownerNickname = results.owner ? results.owner.nickname() : undefined;
          callback(null, activity);
        }
      );
    });
  },

  isValidUrl: function (reservedURLs, url, callback) {
    var isReserved = new RegExp(reservedURLs, 'i').test(url);
    if (isReserved) { return callback(null, false); }
    activitystore.getActivity(url, function (err, result) {
      if (err) { return callback(err); }
      callback(null, result === null);
    });
  },

  activitiesBetween: function (startMoment, endMoment, callback) {
    activitystore.allActivitiesByDateRangeInAscendingOrder(startMoment.unix(), endMoment.unix(), callback);
  },

  addVisitorTo: function (memberId, activityUrl, resourceName, moment, callback) {
    var self = this;
    activitystore.getActivity(activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      var resource = activity.resourceNamed(resourceName);
      var waitinglistEntry = resource.waitinglistEntryFor(memberId);
      var canSubscribe = waitinglistEntry ? waitinglistEntry.canSubscribe() : false;
      if (resource.isRegistrationOpen() || canSubscribe) {
        resource.addMemberId(memberId, moment);
        return activitystore.saveActivity(activity, function (err) {
          if (err && err.message === CONFLICTING_VERSIONS) {
            // we try again because of a racing condition during save:
            return self.addVisitorTo(memberId, activityUrl, resourceName, moment, callback);
          }
          notifications.visitorRegistration(activity, memberId, resourceName);
          return callback(err);
        });
      }
      return callback(null, 'activities.registration_not_now', 'activities.registration_not_possible');
    });
  },

  removeVisitorFrom: function (memberId, activityUrl, resourceName, callback) {
    var self = this;
    activitystore.getActivity(activityUrl, function (err, activity) {
      if (err) {return callback(err); }
      activity.resourceNamed(resourceName).removeMemberId(memberId);
      activitystore.saveActivity(activity, function (err) {
        if (err && err.message === CONFLICTING_VERSIONS) {
          // we try again because of a racing condition during save:
          return self.removeVisitorFrom(memberId, activityUrl, resourceName, callback);
        }
        notifications.visitorUnregistration(activity, memberId, resourceName);
        return callback(err);
      });
    });
  },

  addToWaitinglist: function (memberId, activityUrl, resourceName, moment, callback) {
    var self = this;
    activitystore.getActivity(activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      var resource = activity.resourceNamed(resourceName);
      if (resource.hasWaitinglist()) {
        resource.addToWaitinglist(memberId, moment);
        return activitystore.saveActivity(activity, function (err) {
          if (err && err.message === CONFLICTING_VERSIONS) {
            // we try again because of a racing condition during save:
            return self.addToWaitinglist(memberId, activityUrl, resourceName, moment, callback);
          }
          notifications.waitinglistAddition(activity, memberId, resourceName);
          return callback(err);
        });
      }
      return callback(null, 'activities.waitinglist_not_possible', 'activities.no_waitinglist');
    });
  },

  removeFromWaitinglist: function (memberId, activityUrl, resourceName, callback) {
    var self = this;
    activitystore.getActivity(activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      activity.resourceNamed(resourceName).removeFromWaitinglist(memberId);
      return activitystore.saveActivity(activity, function (err) {
        if (err && err.message === CONFLICTING_VERSIONS) {
          // we try again because of a racing condition during save:
          return self.removeFromWaitinglist(memberId, activityUrl, resourceName, callback);
        }
        notifications.waitinglistRemoval(activity, memberId, resourceName);
        return callback(err);
      });
    });
  }
};
