"use strict";
const R = require("ramda");

const activitystore = require("./activitystore");
const groupsService = require("../groups/groupsService");
const groupstore = require("../groups/groupstore");
const membersService = require("../members/membersService");
const memberstore = require("../members/memberstore");
const notifications = require("../notifications");
const fieldHelpers = require("../commons/fieldHelpers");
const CONFLICTING_VERSIONS = require("../commons/constants").CONFLICTING_VERSIONS;

module.exports = {
  getActivitiesForDisplay: function getActivitiesForDisplay(activitiesFetcher) {
    const activities = activitiesFetcher();
    const groups = groupstore.allGroups();
    const groupColors = groupsService.allGroupColors();

    if (!activities) {
      return;
    }
    activities.forEach((activity) => {
      activity.colorRGB = activity.colorFrom(groupColors);
      activity.groupFrom(groups); // sets the group object in activity
    });
    return activities;
  },

  getUpcomingActivitiesOfMemberAndHisGroups: function getUpcomingActivitiesOfMemberAndHisGroups(member) {
    const groupIds = member.subscribedGroups.map((group) => group.id);
    const activitiesFetcher = R.partial(activitystore.activitiesForGroupIdsAndRegisteredMemberId.bind(activitystore), [
      groupIds,
      member.id(),
      true,
    ]);

    return this.getActivitiesForDisplay(activitiesFetcher);
  },

  getPastActivitiesOfMember: function getPastActivitiesOfMember(member) {
    const activitiesFetcher = R.partial(activitystore.activitiesForGroupIdsAndRegisteredMemberId.bind(activitystore), [
      [],
      member.id(),
      false,
    ]);
    return this.getActivitiesForDisplay(activitiesFetcher);
  },

  getOrganizedOrEditedActivitiesOfMember: function getOrganizedOrEditedActivitiesOfMember(member) {
    const activitiesFetcher = R.partial(activitystore.organizedOrEditedActivitiesForMemberId, [member.id()]);
    return this.getActivitiesForDisplay(activitiesFetcher);
  },

  getActivityWithGroupAndParticipants: function getActivityWithGroupAndParticipants(url) {
    const activity = activitystore.getActivity(url);
    if (!activity) {
      return;
    }
    const owner = memberstore.getMemberForId(activity.owner());
    activity.group = groupstore.getGroup(activity.assignedGroup());
    activity.participants = memberstore.getMembersForIds(activity.allRegisteredMembers());
    activity.ownerNickname = owner ? owner.nickname() : undefined;
    return activity;
  },

  getActivityWithGroupAndParticipantsWithAvatars: async function getActivityWithGroupAndParticipantsWithAvatars(url) {
    async function participantsLoader(activity) {
      const members = memberstore.getMembersForIds(activity.allRegisteredMembers());
      await Promise.all(members.map(membersService.putAvatarIntoMemberAndSave));
      return members;
    }

    const activity = activitystore.getActivity(url);
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

  isValidUrl: function isValidUrl(reservedURLs, url) {
    const isReserved = new RegExp(reservedURLs, "i").test(url);
    if (fieldHelpers.containsSlash(url) || isReserved) {
      return false;
    }
    return !activitystore.getActivity(url);
  },

  activitiesBetween: function activitiesBetween(startMillis, endMillis) {
    return activitystore.allActivitiesByDateRangeInAscendingOrder(startMillis, endMillis);
  },

  addVisitorTo: async function addVisitorTo(memberId, activityUrl, millis) {
    const self = this;
    const activity = activitystore.getActivity(activityUrl);
    if (!activity) {
      return ["message.title.problem", "message.content.activities.does_not_exist"];
    }
    if (activity.addMemberId(memberId, millis)) {
      try {
        activitystore.saveActivity(activity);
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
    const activity = activitystore.getActivity(activityUrl);
    if (!activity) {
      return ["message.title.problem", "message.content.activities.does_not_exist"];
    }
    activity.removeMemberId(memberId);
    try {
      activitystore.saveActivity(activity);
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
    const activity = activitystore.getActivity(activityUrl);
    if (!activity) {
      return ["message.title.problem", "message.content.activities.does_not_exist"];
    }
    if (activity.hasWaitinglist()) {
      activity.addToWaitinglist(memberId, millis);
      try {
        activitystore.saveActivity(activity);
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
    const activity = activitystore.getActivity(activityUrl);
    if (!activity) {
      return ["message.title.problem", "message.content.activities.does_not_exist"];
    }
    activity.removeFromWaitinglist(memberId);
    try {
      activitystore.saveActivity(activity);
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
