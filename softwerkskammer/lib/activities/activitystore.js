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

function toActivityList(jsobjects) {
  return jsobjects.map((record) => {
    return record && record.isSoCraTes ? new SoCraTesActivity(record) : new Activity(record);
  });
}

function allActivitiesByDateRange(rangeFromMillis, rangeToMillis, sortOrder) {
  const result = persistence.listByWhere(
    `startDate < '${new Date(rangeToMillis).toISOString()}' AND endDate > '${new Date(rangeFromMillis).toISOString()}'`,
    `startDate ${sortOrder}`,
  );
  return toActivityList(result);
}

function allActivitiesByDateRangeInAscendingOrder(rangeFrom, rangeTo) {
  return allActivitiesByDateRange(rangeFrom, rangeTo, "ASC");
}

function allActivitiesByDateRangeInDescendingOrder(rangeFrom, rangeTo) {
  return allActivitiesByDateRange(rangeFrom, rangeTo, "DESC");
}

function flattenAndSortMongoResultCollection(collection) {
  return R.sortBy(R.prop("startDate"), R.flatten(collection[0].value));
}

module.exports = {
  allActivities: function allActivities() {
    const result = persistence.list("startDate ASC");
    return toActivityList(result);
  },

  allActivitiesByDateRangeInAscendingOrder,

  upcomingActivities: function upcomingActivities() {
    const start = Date.now();
    const end = start + 315569260000; // 10 years as millis;
    return allActivitiesByDateRangeInAscendingOrder(start, end);
  },

  pastActivities: function pastActivities() {
    const start = 0;
    const end = Date.now();
    return allActivitiesByDateRangeInDescendingOrder(start, end);
  },

  getActivity: function getActivity(url) {
    const result = persistence.getByField({ key: "url", val: url });
    return toActivity(result);
  },

  getActivityForId: function getActivityForId(id) {
    const result = persistence.getById(id);
    return toActivity(result);
  },

  saveActivity: function saveActivity(activity) {
    return persistence.saveWithVersion(activity.state);
  },

  removeActivity: function removeActivity(activity) {
    return persistence.removeById(activity.id());
  },

  upcomingActivitiesForGroupIds: function upcomingActivitiesForGroupIds(groupIds) {
    const group = groupIds[0];
    const result = persistence.listByWhere(
      `endDate > '${new Date().toISOString()}' AND json_extract( data, '$.assignedGroup' ) = '${group}'`,
      "startDate ASC",
    );
    return toActivityList(result);
  },

  pastActivitiesForGroupIds: function pastActivitiesForGroupIds(groupIds) {
    const group = groupIds[0];
    const result = persistence.listByWhere(
      `endDate < '${new Date().toISOString()}' AND json_extract( data, '$.assignedGroup' ) = '${group}'`,
      "startDate DESC",
    );
    return toActivityList(result);
  },

  organizedOrEditedActivitiesForMemberId: function organizedOrEditedActivitiesForMemberId(memberId) {
    const result = persistence.listByWhere(
      `json_extract( data, '$.owner' ) = '${memberId}' OR json_extract( data, '$.editorIds' ) like '%${memberId}%'`,
      "startDate DESC",
    );
    return toActivityList(result);
  },

  activitiesForGroupIdsAndRegisteredMemberId: function activitiesForGroupIdsAndRegisteredMemberId(
    groupIds,
    memberId,
    upcoming,
  ) {
    const activities = upcoming ? this.upcomingActivities() : this.pastActivities();
    return activities.filter(
      (activity) =>
        groupIds.includes(activity.assignedGroup()) || activity.veranstaltung().registeredMembers().includes(memberId),
    );
  },

  flattenAndSortMongoResultCollection,
};
