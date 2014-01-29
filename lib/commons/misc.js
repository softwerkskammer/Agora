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

  parseBlogPost: function (path, post) {
    var splitLines = post.split('\n');
    var title = splitLines[0];
    var teaser = splitLines[2];

    var re = new RegExp(conf.stores.wiki.get("blog_entry_regex"));
    var match = path.match(re);

    var date;
    if (match === null) {
      return undefined;
    } else {
      date = new moment(match[1]);
      if (!date.isValid()) {
        return undefined;
      }
    }

    if (title === '' || title === undefined) {
      return undefined;
    }

    return { title: title.substring(1),
      date: date,
      path: path.substring(0, path.length - 3),
      teaser: teaser};
  }
};

