const beans = require("simple-configure").get("beans");

const persistence = beans.get("groupsPersistence");
const Group = beans.get("group");

module.exports = {
  allGroups: async function allGroups() {
    const result = await persistence.list("data->>'$.longName' ASC");
    return result.map((each) => new Group(each));
  },

  groupsByLists: async function groupsByLists(lists) {
    const groups = await persistence.listByIds(lists, "data->>'$.longName' ASC");
    return groups.map((each) => new Group(each));
  },

  getGroup: async function getGroup(groupname) {
    const group = await persistence.getById(groupname, true);
    return group && group.id ? new Group(group) : null;
  },

  getGroupForPrefix: async function getGroupForPrefix(prefix) {
    const group = await persistence.getByWhere(`json_extract ( data, '$.emailPrefix' ) = '${prefix}'`);
    return group && group.id ? new Group(group) : null;
  },

  getGroupsWithMeetupURL: async function getGroupsWithMeetupURL() {
    const groups = await persistence.listByWhere("json_extract ( data, '$.meetupURL' ) != ''");
    return groups.map((each) => new Group(each));
  },

  saveGroup: async function saveGroup(group) {
    delete group.members; // we do not want to persist the group members
    return persistence.save(group);
  },
};
