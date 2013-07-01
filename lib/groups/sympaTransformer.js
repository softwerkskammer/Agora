"use strict";

var conf = require('nconf');
var misc = conf.get('beans').get('misc');

var stripMailSuffix = function (item) {
  var index = item.listAddress.search('@');
  if (index !== -1) {
    return item.listAddress.substring(0, index);
  }
  return item.listAddress;
};

module.exports = {

  stripMailSuffixes: function (items) {
    return items.map(stripMailSuffix);
  },

  inputItemToArray: function (input) {
    if (input && input.item) {
      return misc.toArray(input.item);
    }
    return [];
  }
};
