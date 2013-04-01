"use strict";


module.exports = function () {

  var stripMailSuffix = function (item) {
    var index = item.listAddress.search('@');
    if (index !== -1) {
      return { listAddress: item.listAddress.substring(0, index) };
    }
    return { listAddress: item.listAddress };
  };

  return {
    stripMailSuffixes: function (items) {
      return items.map(stripMailSuffix);
    }
  };
};