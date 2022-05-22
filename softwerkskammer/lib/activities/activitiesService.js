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
  getActivitiesForDisplay: async function getActivitiesForDisplay(asynActivitiesFetcher) {
    /*
    const activities = await asynActivitiesFetcher();
    const groups = await groupstore.allGroups();
    const groupColors = await groupsService.allGroupColors();
    */
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

  getUpcomingActivitiesOfMemberAndHisGroups: async function getUpcomingActivitiesOfMemberAndHisGroups(member) {
    const groupIds = member.subscribedGroups.map((group) => group.id);
    const activitiesFetcher = R.partial(activitystore.activitiesForGroupIdsAndRegisteredMemberId.bind(activitystore), [
      groupIds,
      member.id(),
      true,
    ]);

    return this.getActivitiesForDisplay(activitiesFetcher);
  },

  getPastActivitiesOfMember: async function getPastActivitiesOfMember(member) {
    const activitiesFetcher = R.partial(activitystore.activitiesForGroupIdsAndRegisteredMemberId.bind(activitystore), [
      [],
      member.id(),
      false,
    ]);
    return this.getActivitiesForDisplay(activitiesFetcher);
  },

  getOrganizedOrEditedActivitiesOfMember: async function getOrganizedOrEditedActivitiesOfMember(member) {
    const activitiesFetcher = R.partial(activitystore.organizedOrEditedActivitiesForMemberId, [member.id()]);
    return this.getActivitiesForDisplay(activitiesFetcher);
  },

  getActivityWithGroupAndParticipants: async function getActivityWithGroupAndParticipants(url) {
    async function participantsLoader(activity) {
      const members = await memberstore.getMembersForIds(activity.allRegisteredMembers());
      await Promise.all(members.map(membersService.putAvatarIntoMemberAndSave));
      return members;
    }

    const activity = await activitystore.getActivity(url);
    if (!activity) {
      return;
    }
    const [group, participants, owner] = await Promise.all([
      groupstore.getGroup(activity.assignedGroup()),
      participantsLoader(activity),
      memberstore.getMemberForId(activity.owner()),
    ]);
    activity.group = group;
    activity.participants = participants;
    activity.ownerNickname = owner ? owner.nickname() : undefined;
    return activity;
  },

  isValidUrl: async function isValidUrl(reservedURLs, url) {
    const isReserved = new RegExp(reservedURLs, "i").test(url);
    if (fieldHelpers.containsSlash(url) || isReserved) {
      return false;
    }
    const result = await activitystore.getActivity(url);
    return !result;
  },

  activitiesBetween: async function activitiesBetween(startMillis, endMillis) {
    return activitystore.allActivitiesByDateRangeInAscendingOrder(startMillis, endMillis);
  },

  addVisitorTo: async function addVisitorTo(memberId, activityUrl, millis) {
    const self = this;
    const activity = await activitystore.getActivity(activityUrl);
    if (!activity) {
      return ["message.title.problem", "message.content.activities.does_not_exist"];
    }
    if (activity.addMemberId(memberId, millis)) {
      try {
        await activitystore.saveActivity(activity);
        const result = await notifications.visitorRegistration(activity, memberId);
        return Array.isArray(result) ? result : [];
      } catch (err1) {
        if (err1 && err1.message === CONFLICTING_VERSIONS) {
          // we try again because of a racing condition during save:
          return self.addVisitorTo(memberId, activityUrl, millis);
        }
        throw err1;
      }
    }
    return ["activities.registration_not_now", "activities.registration_not_possible"];
  },

  removeVisitorFrom: async function removeVisitorFrom(memberId, activityUrl) {
    const self = this;
    const activity = await activitystore.getActivity(activityUrl);
    if (!activity) {
      return ["message.title.problem", "message.content.activities.does_not_exist"];
    }
    activity.removeMemberId(memberId);
    try {
      await activitystore.saveActivity(activity);
      const result = await notifications.visitorUnregistration(activity, memberId);
      return Array.isArray(result) ? result : [];
    } catch (err1) {
      if (err1 && err1.message === CONFLICTING_VERSIONS) {
        // we try again because of a racing condition during save:
        return self.removeVisitorFrom(memberId, activityUrl);
      }
      throw err1;
    }
  },

  addToWaitinglist: async function addToWaitinglist(memberId, activityUrl, millis) {
    const activity = await activitystore.getActivity(activityUrl);
    if (!activity) {
      return ["message.title.problem", "message.content.activities.does_not_exist"];
    }
    if (activity.hasWaitinglist()) {
      activity.addToWaitinglist(memberId, millis);
      try {
        await activitystore.saveActivity(activity);
        const result = await notifications.waitinglistAddition(activity, memberId);
        return Array.isArray(result) ? result : [];
      } catch (err1) {
        if (err1 && err1.message === CONFLICTING_VERSIONS) {
          // we try again because of a racing condition during save:
          return this.addToWaitinglist(memberId, activityUrl, millis);
        }
        throw err1;
      }
    }
    return ["activities.waitinglist_not_possible", "activities.no_waitinglist"];
  },

  removeFromWaitinglist: async function removeFromWaitinglist(memberId, activityUrl) {
    const self = this;
    const activity = await activitystore.getActivity(activityUrl);
    if (!activity) {
      return ["message.title.problem", "message.content.activities.does_not_exist"];
    }
    activity.removeFromWaitinglist(memberId);
    try {
      await activitystore.saveActivity(activity);
      const result = await notifications.waitinglistRemoval(activity, memberId);
      return Array.isArray(result) ? result : [];
    } catch (err1) {
      if (err1 && err1.message === CONFLICTING_VERSIONS) {
        // we try again because of a racing condition during save:
        return self.removeFromWaitinglist(memberId, activityUrl);
      }
      throw err1;
    }
  },
};
