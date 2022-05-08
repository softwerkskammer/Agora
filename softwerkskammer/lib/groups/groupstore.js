const beans = require("simple-configure").get("beans");
const R = require("ramda");

const persistence = beans.get("groupsPersistence");
const Group = beans.get("group");
const misc = beans.get("misc");

const toGroup = R.partial(misc.toObject, [Group]);
const toGroupList = R.partial(misc.toObjectList, [Group]);

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

  getGroupForPrefix: function getGroupForPrefix(prefix, callback) {
    persistence.getByField({ emailPrefix: misc.toLowerCaseRegExp(prefix) }, R.partial(toGroup, [callback]));
  },

  getGroupsWithMeetupURL: function getGroupsWithMeetupURL(callback) {
    persistence.listByField(
      { meetupURL: { $exists: true, $nin: ["", null, undefined] } },
      {},
      R.partial(toGroupList, [callback])
    );
  },

  saveGroup: function saveGroup(group, callback) {
    delete group.members; // we do not want to persist the group members
    persistence.save(group, callback);
  },
};
