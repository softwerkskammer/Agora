"use strict";

module.exports = {
  list: function (sortOrder, callback) { callback(null, []); },

  listByIds: function (list, sortOrder, callback) { callback(null, []); },

  listByEMails: function (list, sortOrder, callback) { callback(null, []); },

  listByField: function (searchObject, sortOrder, callback) { callback(null, []); },

  listByFieldWithOptions: function (searchObject, options, sortOrder, callback) { callback(null, []); },

  getById: function (id, callback) { callback(null, undefined); },

  getByField: function (fieldAsObject, callback) { callback(null, undefined); },

  save: function (object, callback) { callback(null, undefined); },

  saveAll: function (objects, callback) { callback(null, undefined); },

  drop: function (callback) {callback(null, undefined); }
};

