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

  getActivityWithGroupAndParticipants: function getActivityWithGroupAndParticipants(url, callback) {
    activitystore.getActivity(url, (err, activity) => {
      if (err || !activity) {
        return callback(err);
      }

      async function participantsLoader() {
        const members = await memberstore.getMembersForIds(activity.allRegisteredMembers());
        await Promise.all(members.map(membersService.putAvatarIntoMemberAndSave));
        return members;
      }

      async.parallel(
        {
          group: async.asyncify(async () => await groupstore.getGroup(activity.assignedGroup())),
          participants: async.asyncify(async () => await participantsLoader()),
          owner: async.asyncify(async () => await memberstore.getMemberForId(activity.owner())),
        },

        (err1, results) => {
          if (err1) {
            return callback(err1);
          }
          activity.group = results.group;
          activity.participants = results.participants;
          activity.ownerNickname = results.owner ? results.owner.nickname() : undefined;
          callback(null, activity);
        }
      );
    });
  },

  isValidUrl: function isValidUrl(reservedURLs, url, callback) {
    const isReserved = new RegExp(reservedURLs, "i").test(url);
    if (fieldHelpers.containsSlash(url) || isReserved) {
      return callback(null, false);
    }
    activitystore.getActivity(url, (err, result) => {
      if (err) {
        return callback(err);
      }
      callback(null, result === null);
    });
  },

  activitiesBetween: function activitiesBetween(startMillis, endMillis, callback) {
    activitystore.allActivitiesByDateRangeInAscendingOrder(startMillis, endMillis, callback);
  },

  addVisitorTo: function addVisitorTo(memberId, activityUrl, millis, callback) {
    const self = this;
    activitystore.getActivity(activityUrl, (err, activity) => {
      if (err || !activity) {
        return callback(err, "message.title.problem", "message.content.activities.does_not_exist");
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
      return callback(null, "activities.registration_not_now", "activities.registration_not_possible");
    });
  },

  removeVisitorFrom: function removeVisitorFrom(memberId, activityUrl, callback) {
    const self = this;
    activitystore.getActivity(activityUrl, (err, activity) => {
      if (err || !activity) {
        return callback(err, "message.title.problem", "message.content.activities.does_not_exist");
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
    });
  },

  addToWaitinglist: function addToWaitinglist(memberId, activityUrl, millis, callback) {
    activitystore.getActivity(activityUrl, (err, activity) => {
      if (err || !activity) {
        return callback(err, "message.title.problem", "message.content.activities.does_not_exist");
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
    });
  },

  removeFromWaitinglist: function removeFromWaitinglist(memberId, activityUrl, callback) {
    const self = this;
    activitystore.getActivity(activityUrl, (err, activity) => {
      if (err || !activity) {
        return callback(err, "message.title.problem", "message.content.activities.does_not_exist");
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
    });
  },
};
