'use strict';

const beans = require('simple-configure').get('beans');
const R = require('ramda');

const persistence = beans.get('groupsPersistence');
const Group = beans.get('group');
const misc = beans.get('misc');

const toGroup = R.partial(misc.toObject, [Group]);
const toGroupList = R.partial(misc.toObjectList, [Group]);

module.exports = {
  allGroups: function allGroups(callback) {
    persistence.list({longName: 1}, R.partial(toGroupList, [callback]));
  },

  groupsByLists: function groupsByLists(lists, callback) {
    persistence.listByIds(lists, {longName: 1}, R.partial(toGroupList, [callback]));
  },

  getGroup: function getGroup(groupname, callback) {
    persistence.getById(misc.toLowerCaseRegExp(groupname), R.partial(toGroup, [callback]));
  },

  getGroupForPrefix: function getGroupForPrefix(prefix, callback) {
    persistence.getByField({emailPrefix: misc.toLowerCaseRegExp(prefix)}, R.partial(toGroup, [callback]));
  },

  saveGroup: function saveGroup(group, callback) {
    delete group.members; // we do not want to persist the group members
    persistence.save(group, callback);
  }
};

