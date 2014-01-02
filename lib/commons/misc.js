"use strict";
var _ = require('lodash');
var conf = require('nconf');
var moment = require('moment-timezone');

function asWholeWordEscaped(string) {
  return '^' + string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") + '$';
}

module.exports = {
  toArray: function (elem) {
    if (!elem) { return []; }
    if (elem instanceof Array) { return elem; }
    if (typeof(elem) === 'string') { return elem.split(','); }
    return [ elem ];
  },

  toLowerCaseRegExp: function (string) {
    return new RegExp(asWholeWordEscaped(string), 'i');
  },

  arrayToLowerCaseRegExp: function (stringsArray) {
    var escapedStrings = _.chain(stringsArray).compact().map(function (string) { return asWholeWordEscaped(string); }).value();
    return new RegExp(escapedStrings.join('|'), 'i');
  },

  differenceCaseInsensitive: function (strings, stringsToReduce) {
    function prepare(strings) {
      return _.chain(strings).compact().invoke('toLowerCase').value();
    }

    return _.difference(prepare(strings), prepare(stringsToReduce));
  },

  toFullQualifiedUrl: function (prefix, localUrl) {
    function trimLeadingAndTrailingSlash(string) {
      return string.replace(/(^\/)|(\/$)/g, '');
    }

    return conf.get('publicUrlPrefix') + '/' + trimLeadingAndTrailingSlash(prefix) + '/' + trimLeadingAndTrailingSlash(localUrl);
  },

  parseBlogPost: function (rawBlogpost) {
    var splitLines = rawBlogpost.split('\n');
    var title = splitLines[0].split(',')[0];
    var rawDate = splitLines[0].split(',')[1];
    var date;
    var teaser = splitLines[2];

    if (rawDate === undefined || rawDate === '') {
      date = new moment("not a date");
    } else {
      date = new moment(splitLines[0].split(',')[1].trim());
    }

    if (title === '') {
      return undefined;
    }

    return { title: title,
      date: date,
      teaser: teaser};
  }
};

