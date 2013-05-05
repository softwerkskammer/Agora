"use strict";

var _s = require('underscore.string');

function isFilled(someValue) {
  return someValue !== undefined && someValue !== null && someValue !== 'undefined' &&
    (typeof (someValue) === 'String' ? someValue.trim().length > 0 : true);
}

module.exports = {
  isFilled: isFilled,

  valueOrFallback: function (value, fallback) {
    return isFilled(value) ? value : fallback;
  },

  removePrefixFrom: function (prefix, string) {
    var regexp = new RegExp('^' + prefix);
    return  string ? string.replace(regexp, '') : null;
  },

  addPrefixTo: function (prefix, string, additionalPrefixToCheck) {
    if (string && !_s.startsWith(string, prefix) && !_s.startsWith(string, additionalPrefixToCheck)) {
      return prefix + string;
    }
    return string;
  },

  createLinkFrom: function (fieldArray) {
    return  fieldArray.join('_').replace(/[ #,!?ßöäü:"']/g, '_');
  }

}
;
