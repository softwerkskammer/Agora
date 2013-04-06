"use strict";


module.exports = function () {

  var stripMailSuffix = function (item) {
    var index = item.listAddress.search('@');
    if (index !== -1) {
      return item.listAddress.substring(0, index);
    }
    return item.listAddress;
  };

  var toArray = function (elem) {
    if (elem instanceof Array) {
      return elem;
    }
    return [ elem ];
  };

  return {

    stripMailSuffixes: function (items) {
      return items.map(stripMailSuffix);
    },

    inputItemToArray: function (input) {
      if (input && input.item) {
        return toArray(input.item);
      }
      return [];
    },

    toArray: toArray

  };
};