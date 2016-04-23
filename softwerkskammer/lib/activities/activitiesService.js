'use strict';

var async = require('async');
var _ = require('lodash');

var beans = require('simple-configure').get('beans');

var activitystore = beans.get('activitystore');
var groupsService = beans.get('groupsService');
var groupstore = beans.get('groupstore');
var membersService = beans.get('membersService');
var memberstore = beans.get('memberstore');
var notifications = beans.get('notifications');
var fieldHelpers = beans.get('fieldHelpers');
var CONFLICTING_VERSIONS = beans.get('constants').CONFLICTING_VERSIONS;

module.exports = {
  getActivitiesForDisplay: function (activitiesFetcher, callback) {
    async.parallel(
      {
        activities: activitiesFetcher,
        groups: function (cb) { groupsService.getAllAvailableGroups(cb); },
        groupColors: function (cb) { groupsService.allGroupColors(cb); }
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
    var activitiesFetcher = function (mem) {
      var groupIds = _.map(mem.subscribedGroups, 'id');
      return _.partial(activitystore.activitiesForGroupIdsAndRegisteredMemberId, groupIds, mem.id(), true);
    };

    return this.getActivitiesForDisplay(activitiesFetcher(member), callback);
  },

  getPastActivitiesOfMember: function (member, callback) {
    var activitiesFetcher = function (mem) {
      return _.partial(activitystore.activitiesForGroupIdsAndRegisteredMemberId, [], mem.id(), false);
    };

    return this.getActivitiesForDisplay(activitiesFetcher(member), callback);
  },

  getActivityWithGroupAndParticipants: function (url, callback) {
    activitystore.getActivity(url, function (err, activity) {
      if (err || !activity) { return callback(err); }

      var participantsLoader = function (cb) {
        memberstore.getMembersForIds(activity.allRegisteredMembers(), function (err1, members) {
          async.each(members, membersService.putAvatarIntoMemberAndSave, function () {
            cb(err1, members);
          });
        });
      };
      async.parallel(
        {
          group: function (cb) { groupstore.getGroup(activity.assignedGroup(), cb); },
          participants: participantsLoader,
          owner: function (cb) { memberstore.getMemberForId(activity.owner(), cb); }
        },

        function (err1, results) {
          if (err1) {return callback(err1); }
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
    if (fieldHelpers.containsSlash(url) || isReserved) { return callback(null, false); }
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
      if (err || !activity) { return callback(err, 'message.title.problem', 'message.content.activities.does_not_exist'); }
      if (activity.resourceNamed(resourceName).addMemberId(memberId, moment)) {
        return activitystore.saveActivity(activity, function (err1) {
          if (err1 && err1.message === CONFLICTING_VERSIONS) {
            // we try again because of a racing condition during save:
            return self.addVisitorTo(memberId, activityUrl, resourceName, moment, callback);
          }
          if (err1) { return callback(err1); }
          notifications.visitorRegistration(activity, memberId, resourceName);
          return callback(err1);
        });
      }
      return callback(null, 'activities.registration_not_now', 'activities.registration_not_possible');
    });
  },

  removeVisitorFrom: function (memberId, activityUrl, resourceName, callback) {
    var self = this;
    activitystore.getActivity(activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err, 'message.title.problem', 'message.content.activities.does_not_exist'); }
      activity.resourceNamed(resourceName).removeMemberId(memberId);
      activitystore.saveActivity(activity, function (err1) {
        if (err1 && err1.message === CONFLICTING_VERSIONS) {
          // we try again because of a racing condition during save:
          return self.removeVisitorFrom(memberId, activityUrl, resourceName, callback);
        }
        notifications.visitorUnregistration(activity, memberId, resourceName);
        return callback(err1);
      });
    });
  },

  addToWaitinglist: function (memberId, activityUrl, resourceName, moment, callback) {
    var self = this;
    activitystore.getActivity(activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err, 'message.title.problem', 'message.content.activities.does_not_exist'); }
      var resource = activity.resourceNamed(resourceName);
      if (resource.hasWaitinglist()) {
        resource.addToWaitinglist(memberId, moment);
        return activitystore.saveActivity(activity, function (err1) {
          if (err1 && err1.message === CONFLICTING_VERSIONS) {
            // we try again because of a racing condition during save:
            return self.addToWaitinglist(memberId, activityUrl, resourceName, moment, callback);
          }
          notifications.waitinglistAddition(activity, memberId, resourceName);
          return callback(err1);
        });
      }
      return callback(null, 'activities.waitinglist_not_possible', 'activities.no_waitinglist');
    });
  },

  removeFromWaitinglist: function (memberId, activityUrl, resourceName, callback) {
    var self = this;
    activitystore.getActivity(activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err, 'message.title.problem', 'message.content.activities.does_not_exist'); }
      activity.resourceNamed(resourceName).removeFromWaitinglist(memberId);
      return activitystore.saveActivity(activity, function (err1) {
        if (err1 && err1.message === CONFLICTING_VERSIONS) {
          // we try again because of a racing condition during save:
          return self.removeFromWaitinglist(memberId, activityUrl, resourceName, callback);
        }
        notifications.waitinglistRemoval(activity, memberId, resourceName);
        return callback(err1);
      });
    });
  }
};
