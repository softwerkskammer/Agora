const async = require("async");
const R = require("ramda");

const beans = require("simple-configure").get("beans");

const activitystore = beans.get("activitystore");
const groupsService = beans.get("groupsService");
const groupstore = beans.get("groupstore");
const membersService = beans.get("membersService");
const memberstore = beans.get("memberstore");
const notifications = beans.get("notifications");
const fieldHelpers = beans.get("fieldHelpers");
const CONFLICTING_VERSIONS = beans.get("constants").CONFLICTING_VERSIONS;

module.exports = {
  getActivitiesForDisplay: function getActivitiesForDisplay(activitiesFetcher, callback) {
    async.parallel(
      {
        activities: activitiesFetcher,
        groups: async.asyncify(async () => await groupstore.allGroups()),
        groupColors: async.asyncify(async () => await groupsService.allGroupColors()),
      },

      (err, results) => {
        if (err || !results.activities) {
          callback(err);
        }
        results.activities.forEach((activity) => {
          activity.colorRGB = activity.colorFrom(results.groupColors);
          activity.groupFrom(results.groups); // sets the group object in activity
        });
        callback(null, results.activities);
      }
    );
  },

  getActivitiesForDisplayAsync: async function getActivitiesForDisplay(asynActivitiesFetcher) {
    const [activities, groups, groupColors] = await Promise.all([
      asynActivitiesFetcher(),
      groupstore.allGroups(),
      groupsService.allGroupColors(),
    ]);

    if (!activities) {
      return;
    }
    activities.forEach((activity) => {
      activity.colorRGB = activity.colorFrom(groupColors);
      activity.groupFrom(groups); // sets the group object in activity
    });
    return activities;
  },

  getUpcomingActivitiesOfMemberAndHisGroups: function getUpcomingActivitiesOfMemberAndHisGroups(member, callback) {
    const groupIds = member.subscribedGroups.map((group) => group.id);
    const activitiesFetcher = R.partial(activitystore.activitiesForGroupIdsAndRegisteredMemberId, [
      groupIds,
      member.id(),
      true,
    ]);

    return this.getActivitiesForDisplay(activitiesFetcher, callback);
  },

  getPastActivitiesOfMember: function getPastActivitiesOfMember(member, callback) {
    const activitiesFetcher = R.partial(activitystore.activitiesForGroupIdsAndRegisteredMemberId, [
      [],
      member.id(),
      false,
    ]);

    return this.getActivitiesForDisplay(activitiesFetcher, callback);
  },

  getOrganizedOrEditedActivitiesOfMember: function getOrganizedOrEditedActivitiesOfMember(member, callback) {
    const activitiesFetcher = R.partial(activitystore.organizedOrEditedActivitiesForMemberId, [member.id()]);

    return this.getActivitiesForDisplay(activitiesFetcher, callback);
  },

  getActivityWithGroupAndParticipants: async function getActivityWithGroupAndParticipants(url, callback) {
    async function participantsLoader(activity) {
      const members = await memberstore.getMembersForIds(activity.allRegisteredMembers());
      await Promise.all(members.map(membersService.putAvatarIntoMemberAndSave));
      return members;
    }

    try {
      const activity = await activitystore.getActivity(url);
      if (!activity) {
        return callback();
      }
      const [group, participants, owner] = await Promise.all([
        groupstore.getGroup(activity.assignedGroup()),
        participantsLoader(activity),
        memberstore.getMemberForId(activity.owner()),
      ]);
      activity.group = group;
      activity.participants = participants;
      activity.ownerNickname = owner ? owner.nickname() : undefined;
      callback(null, activity);
    } catch (e) {
      callback(e);
    }
  },

  isValidUrl: async function isValidUrl(reservedURLs, url, callback) {
    const isReserved = new RegExp(reservedURLs, "i").test(url);
    if (fieldHelpers.containsSlash(url) || isReserved) {
      return callback(null, false);
    }
    try {
      const result = await activitystore.getActivity(url);
      callback(null, result === null);
    } catch (e) {
      callback(e);
    }
  },

  activitiesBetween: async function activitiesBetween(startMillis, endMillis, callback) {
    try {
      const result = await activitystore.allActivitiesByDateRangeInAscendingOrder(startMillis, endMillis);
      callback(null, result);
    } catch (e) {
      callback(e);
    }
  },

  addVisitorTo: async function addVisitorTo(memberId, activityUrl, millis, callback) {
    const self = this;
    try {
      const activity = await activitystore.getActivity(activityUrl);
      if (!activity) {
        return callback("message.title.problem", "message.content.activities.does_not_exist");
      }
      if (activity.addMemberId(memberId, millis)) {
        return activitystore.saveActivity(activity, (err1) => {
          if (err1 && err1.message === CONFLICTING_VERSIONS) {
            // we try again because of a racing condition during save:
            return self.addVisitorTo(memberId, activityUrl, millis, callback);
          }
          if (err1) {
            return callback(err1);
          }
          return notifications.visitorRegistration(activity, memberId, callback);
        });
      }
      callback(null, "activities.registration_not_now", "activities.registration_not_possible");
    } catch (e) {
      callback(e);
    }
  },

  removeVisitorFrom: async function removeVisitorFrom(memberId, activityUrl, callback) {
    try {
      const self = this;
      const activity = await activitystore.getActivity(activityUrl);
      if (!activity) {
        return callback(null, "message.title.problem", "message.content.activities.does_not_exist");
      }
      activity.removeMemberId(memberId);
      activitystore.saveActivity(activity, (err1) => {
        if (err1 && err1.message === CONFLICTING_VERSIONS) {
          // we try again because of a racing condition during save:
          return self.removeVisitorFrom(memberId, activityUrl, callback);
        }
        notifications.visitorUnregistration(activity, memberId);
        return callback(err1);
      });
    } catch (e) {
      callback(e);
    }
  },

  addToWaitinglist: async function addToWaitinglist(memberId, activityUrl, millis, callback) {
    try {
      const activity = await activitystore.getActivity(activityUrl);
      if (!activity) {
        return callback(null, "message.title.problem", "message.content.activities.does_not_exist");
      }
      if (activity.hasWaitinglist()) {
        activity.addToWaitinglist(memberId, millis);
        return activitystore.saveActivity(activity, (err1) => {
          if (err1 && err1.message === CONFLICTING_VERSIONS) {
            // we try again because of a racing condition during save:
            return this.addToWaitinglist(memberId, activityUrl, millis, callback);
          }
          notifications.waitinglistAddition(activity, memberId);
          return callback(err1);
        });
      }
      return callback(null, "activities.waitinglist_not_possible", "activities.no_waitinglist");
    } catch (e) {
      callback(e);
    }
  },

  removeFromWaitinglist: async function removeFromWaitinglist(memberId, activityUrl, callback) {
    try {
      const self = this;
      const activity = await activitystore.getActivity(activityUrl);
      if (!activity) {
        return callback(null, "message.title.problem", "message.content.activities.does_not_exist");
      }
      activity.removeFromWaitinglist(memberId);
      return activitystore.saveActivity(activity, (err1) => {
        if (err1 && err1.message === CONFLICTING_VERSIONS) {
          // we try again because of a racing condition during save:
          return self.removeFromWaitinglist(memberId, activityUrl, callback);
        }
        notifications.waitinglistRemoval(activity, memberId);
        return callback(err1);
      });
    } catch (e) {
      callback(e);
    }
  },
};
