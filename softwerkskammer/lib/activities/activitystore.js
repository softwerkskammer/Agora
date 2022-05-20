const beans = require("simple-configure").get("beans");
const R = require("ramda");

const persistence = beans.get("activitiesPersistence");
const Activity = beans.get("activity");
const SoCraTesActivity = beans.get("socratesActivity");

function toActivity(jsobject) {
  if (jsobject && jsobject.isSoCraTes) {
    return new SoCraTesActivity(jsobject);
  }
  return jsobject ? new Activity(jsobject) : null;
}

function toActivityListAsync(jsobjects) {
  return jsobjects.map((record) => {
    return record && record.isSoCraTes ? new SoCraTesActivity(record) : new Activity(record);
  });
}

async function allActivitiesByDateRange(rangeFrom, rangeTo, sortOrder) {
  const result = await persistence.listByFieldAsync(
    {
      $and: [{ endDate: { $gt: new Date(rangeFrom) } }, { startDate: { $lt: new Date(rangeTo) } }],
    },
    sortOrder
  );
  return toActivityListAsync(result);
}

async function allActivitiesByDateRangeInAscendingOrder(rangeFrom, rangeTo) {
  return allActivitiesByDateRange(rangeFrom, rangeTo, { startDate: 1 });
}

async function allActivitiesByDateRangeInDescendingOrder(rangeFrom, rangeTo) {
  return allActivitiesByDateRange(rangeFrom, rangeTo, { startDate: -1 });
}

function flattenAndSortMongoResultCollection(collection) {
  return R.sortBy(R.prop("startDate"), R.flatten(collection[0].value));
}

module.exports = {
  allActivitiesAsync: async function allActivities() {
    const result = await persistence.listAsync({ startDate: 1 });
    return toActivityListAsync(result);
  },

  allActivitiesByDateRangeInAscendingOrder,

  upcomingActivities: async function upcomingActivities() {
    const start = Date.now();
    const end = start + 315569260000; // 10 years as millis;
    return allActivitiesByDateRangeInAscendingOrder(start, end);
  },

  pastActivities: async function pastActivities() {
    const start = 0;
    const end = Date.now();
    return allActivitiesByDateRangeInDescendingOrder(start, end);
  },

  getActivity: async function getActivity(url) {
    const result = await persistence.getByFieldAsync({ url });
    return toActivity(result);
  },

  getActivityForId: async function getActivityForId(id) {
    const result = await persistence.getByIdAsync(id);
    return toActivity(result);
  },

  saveActivity: async function saveActivity(activity) {
    return persistence.saveWithVersionAsync(activity.state);
  },

  removeActivity: async function removeActivity(activity) {
    return persistence.removeAsync(activity.id());
  },

  upcomingActivitiesForGroupIds: async function upcomingActivitiesForGroupIds(groupIds) {
    const start = new Date();

    const result = await persistence.listByFieldAsync(
      {
        $and: [{ endDate: { $gt: start } }, { assignedGroup: { $in: groupIds } }],
      },
      { startDate: 1 }
    );
    return toActivityListAsync(result);
  },

  pastActivitiesForGroupIds: async function pastActivitiesForGroupIds(groupIds) {
    const start = new Date();

    const result = await persistence.listByFieldAsync(
      {
        $and: [{ endDate: { $lt: start } }, { assignedGroup: { $in: groupIds } }],
      },
      { startDate: -1 }
    );
    return toActivityListAsync(result);
  },

  organizedOrEditedActivitiesForMemberId: async function organizedOrEditedActivitiesForMemberId(memberId) {
    const result = await persistence.listByFieldAsync(
      {
        $or: [
          { owner: memberId },
          { editorIds: memberId }, // matches when the field equals the value or when the field is an array that contains the value
        ],
      },
      { startDate: -1 }
    );
    return toActivityListAsync(result);
  },

  activitiesForGroupIdsAndRegisteredMemberId: async function activitiesForGroupIdsAndRegisteredMemberId(
    groupIds,
    memberId,
    upcoming
  ) {
    const activities = upcoming ? await this.upcomingActivities() : await this.pastActivities();
    return activities.filter(
      (activity) =>
        groupIds.includes(activity.assignedGroup()) || activity.veranstaltung().registeredMembers().includes(memberId)
    );
  },

  flattenAndSortMongoResultCollection,
};
