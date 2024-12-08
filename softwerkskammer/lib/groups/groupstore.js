"use strict";
const persistence = require("./groupsPersistence");

const Group = require("./group");

module.exports = {
  allGroups: function allGroups() {
    const result = persistence.list("data->>'$.longName' ASC");
    return result.map((each) => new Group(each));
  },

  groupsByLists: function groupsByLists(lists) {
    const groups = persistence.listByIds(lists, "data->>'$.longName' ASC");
    return groups.map((each) => new Group(each));
  },

  getGroup: function getGroup(groupname) {
    const group = persistence.getById(groupname, true);
    return group && group.id ? new Group(group) : null;
  },

  getGroupForPrefix: function getGroupForPrefix(prefix) {
    const group = persistence.getByWhere(`json_extract ( data, '$.emailPrefix' ) = '${prefix}'`);
    return group && group.id ? new Group(group) : null;
  },

  getGroupsWithMeetupURL: function getGroupsWithMeetupURL() {
    const groups = persistence.listByWhere("json_extract ( data, '$.meetupURL' ) != ''");
    return groups.map((each) => new Group(each));
  },

  saveGroup: function saveGroup(group) {
    delete group.members; // we do not want to persist the group members
    return persistence.save(group);
  },
};
