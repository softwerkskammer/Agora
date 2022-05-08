const beans = require("simple-configure").get("beans");

const persistence = beans.get("groupsPersistence");
const Group = beans.get("group");
const misc = beans.get("misc");

module.exports = {
  allGroups: async function allGroups() {
    const result = await persistence.listAsync({ longName: 1 });
    return result.map((each) => new Group(each));
  },

  groupsByLists: async function groupsByLists(lists) {
    const groups = await persistence.listByIds(lists, { longName: 1 });
    return groups.map((each) => new Group(each));
  },

  getGroup: async function getGroup(groupname) {
    const group = await persistence.getByIdAsync(misc.toLowerCaseRegExp(groupname));
    return new Group(group);
  },

  getGroupForPrefix: async function getGroupForPrefix(prefix) {
    const group = await persistence.getByField({ emailPrefix: misc.toLowerCaseRegExp(prefix) });
    return new Group(group);
  },

  getGroupsWithMeetupURL: async function getGroupsWithMeetupURL() {
    const groups = await persistence.listByFieldAsync(
      { meetupURL: { $exists: true, $nin: ["", null, undefined] } },
      {}
    );
    return groups.map((each) => new Group(each));
  },

  saveGroup: function saveGroup(group, callback) {
    delete group.members; // we do not want to persist the group members
    persistence.save(group, callback);
  },
};
