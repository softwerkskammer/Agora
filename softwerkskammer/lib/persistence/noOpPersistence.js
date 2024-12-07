"use strict";

module.exports = function noOpPersistence() {
  return {
    list: function () {
      throw new Error("Testpersistence - function list not implemented");
    },

    listByIds: function () {
      throw new Error("Testpersistence - function listByIds not implemented");
    },

    listByWhere: function () {
      throw new Error("Testpersistence - function listByWhere not implemented");
    },

    getById: function () {
      throw new Error("Testpersistence - function getById not implemented");
    },

    getByField: function () {
      throw new Error("Testpersistence - function getByField not implemented");
    },

    getByWhere: function () {
      throw new Error("Testpersistence - function getByWhere not implemented");
    },

    save: function () {
      throw new Error("Testpersistence - function save not implemented");
    },

    removeById: function () {
      throw new Error("Testpersistence - function removeById not implemented");
    },
  };
};
