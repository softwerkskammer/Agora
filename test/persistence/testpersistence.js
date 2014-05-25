'use strict';

module.exports = {
  list: function () {throw new Error('Testpersistence - function list not implemented'); },

  listByIds: function () {throw new Error('Testpersistence - function listByIds not implemented'); },

  listByEMails: function () {throw new Error('Testpersistence - function listByEMails not implemented'); },

  listByField: function () {throw new Error('Testpersistence - function listByField not implemented'); },

  listByFieldWithOptions: function (searchObject, options, sortOrder, callback) {callback(null, []); },

  getById: function () {throw new Error('Testpersistence - function getById not implemented'); },

  getByField: function () {throw new Error('Testpersistence - function getByField not implemented'); },

  save: function () {throw new Error('Testpersistence - function save not implemented'); },

  saveAll: function () {throw new Error('Testpersistence - function saveAll not implemented'); },

  saveValueObject: function () {throw new Error('Testpersistence - function saveValueObject not implemented'); },

  drop: function () {throw new Error('Testpersistence - function drop not implemented'); }
};

