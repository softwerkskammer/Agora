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
    }
  };
};