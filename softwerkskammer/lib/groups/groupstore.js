const beans = require("simple-configure").get("beans");

const persistence = beans.get("groupsPersistence");
const Group = beans.get("group");
const misc = beans.get("misc");

module.exports = {
  allGroups: async function allGroups() {
    const result = await persistence.listMongo({ longName: 1 });
    return result.map((each) => new Group(each));
  },

  groupsByLists: async function groupsByLists(lists) {
    const groups = await persistence.listMongoByIds(lists, { longName: 1 });
    return groups.map((each) => new Group(each));
  },

  getGroup: async function getGroup(groupname) {
    const group = await persistence.getMongoById(misc.toLowerCaseRegExp(groupname));
    return group ? new Group(group) : null;
  },

  getGroupForPrefix: async function getGroupForPrefix(prefix) {
    const group = await persistence.getMongoByField({ emailPrefix: misc.toLowerCaseRegExp(prefix) });
    return group ? new Group(group) : null;
  },

  getGroupsWithMeetupURL: async function getGroupsWithMeetupURL() {
    const groups = await persistence.listMongoByField(
      { meetupURL: { $exists: true, $nin: ["", null, undefined] } },
      {}
    );
    return groups.map((each) => new Group(each));
  },

  saveGroup: async function saveGroup(group) {
    delete group.members; // we do not want to persist the group members
    return persistence.saveMongo(group);
  },
};
