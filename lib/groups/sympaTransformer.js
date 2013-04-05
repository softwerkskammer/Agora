"use strict";


module.exports = function () {

  var stripMailSuffix = function (item) {
    var index = item.listAddress.search('@');
    if (index !== -1) {
      return { groupName: item.listAddress.substring(0, index) };
    }
    return { groupName: item.listAddress };
  };

  return {
    stripMailSuffixes: function (items) {
      return items.map(stripMailSuffix);
    },

    toArray: function (input) {
      if (input && input.item) {
        if (input.item instanceof Array) {
          return input.item;
        }
        else {
          return [ input.item ];
        }
      }
      return [];
    }

  };
};