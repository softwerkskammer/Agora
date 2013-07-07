"use strict";

var _s = require('underscore.string');
var crypto = require('crypto');
module.exports = {
  isFilled: function (someValue) {
    return someValue !== undefined && someValue !== null && someValue !== 'undefined' &&
      (typeof (someValue) === 'String' ? someValue.trim().length > 0 : true);
  },

  valueOrFallback: function (value, fallback) {
    return this.isFilled(value) ? value : fallback;
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
    return fieldArray.join('_').replace(/[ #,!?ßöäü:"']/g, '_');
  },

  md5: function (text) {
    return crypto.createHash('md5').update(text).digest("hex");
  },

  replaceMailAddresses: function (text) {
    if (text) {
      return text.replace(/[\w.-]+@[\w.-]+\.[\w.-]{2,3}(?!\w)/g, '...@...');
      // this means: some chars @ some chars . 2 or 3 chars, not followed by a char
      // where char = a-z A-Z 0-9 _ . -
    }
    return text;
  },

  pushIntoProperty: function (object, propertyName, element) {
    if (!object[propertyName]) {
      object[propertyName] = [element];
    }
    else {
      object[propertyName].push(element);
    }
  }

};
