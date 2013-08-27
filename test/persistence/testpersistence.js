"use strict";

module.exports = {
  list: function () {throw new Error('function list not implemented'); },

  listByIds: function () {throw new Error('function listByIds not implemented'); },

  listByEMails: function () {throw new Error('function listByEMails not implemented'); },

  listByField: function () {throw new Error('function listByField not implemented'); },

  listByFieldWithOptions: function (searchObject, options, sortOrder, callback) {callback(null, []); },

  getById: function () {throw new Error('function getById not implemented'); },

  getByField: function () {throw new Error('function getByField not implemented'); },

  save: function () {throw new Error('function save not implemented'); },

  saveAll: function () {throw new Error('function saveAll not implemented'); },

  drop: function () {throw new Error('function drop not implemented'); }
};

