"use strict";
var _ = require('underscore');

module.exports = {
  toArray: function (elem) {
    if (!elem) { return []; }
    if (elem instanceof Array) { return elem; }
    if (typeof(elem) === 'string') { return elem.split(','); }
    return [ elem ];
  },

  toLowerCaseRegExp: function (string) {
    function escape(string) {
      return string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }
    return new RegExp('^' + escape(string) + '$', 'i');
  },

  differenceCaseInsensitive: function (strings, stringsToReduce) {
    function prepare(strings) {
      return _.chain(strings).compact().invoke('toLowerCase').value();
    }
    return _.difference(prepare(strings), prepare(stringsToReduce));
  }
};

