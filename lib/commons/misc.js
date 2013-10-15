"use strict";
var _ = require('underscore');

function escapeForRegExp(string) {
  return string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

module.exports = {
  toArray: function (elem) {
    if (!elem) { return []; }
    if (elem instanceof Array) { return elem; }
    if (typeof(elem) === 'string') { return elem.split(','); }
    return [ elem ];
  },

  toLowerCaseRegExp: function (string) {
    return new RegExp('^' + escapeForRegExp(string) + '$', 'i');
  },

  differenceCaseInsensitive: function (strings, stringsToReduce) {
    return _.difference(_.invoke(_.compact(strings), 'toLowerCase'), _.invoke(_.compact(stringsToReduce), 'toLowerCase'));
  }

};

