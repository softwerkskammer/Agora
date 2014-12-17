'use strict';

var beans = require('simple-configure').get('beans');
var _ = require('lodash');

var persistence = beans.get('groupsPersistence');
var Group = beans.get('group');
var misc = beans.get('misc');

var toGroup = _.partial(misc.toObject, Group);
var toGroupList = _.partial(misc.toObjectList, Group);

module.exports = {
  allGroups: function (callbackForGroups) {
    persistence.list({longName: 1}, _.partial(toGroupList, callbackForGroups));
  },

  groupsByLists: function (lists, callbackForGroups) {
    persistence.listByIds(lists, {longName: 1}, _.partial(toGroupList, callbackForGroups));
  },

  getGroup: function (name, callbackForGroup) {
    persistence.getById(misc.toLowerCaseRegExp(name), _.partial(toGroup, callbackForGroup));
  },

  getGroupForPrefix: function (prefix, callbackForGroup) {
    persistence.getByField({emailPrefix: misc.toLowerCaseRegExp(prefix)}, _.partial(toGroup, callbackForGroup));
  },

  saveGroup: function (group, callback) {
    delete group.members; // we do not want to persist the group members
    persistence.save(group, callback);
  }
};

