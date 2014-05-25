'use strict';

var _ = require('lodash');
var express = require('express');
var path = require('path');
var conf = require('nconf');
var moment = require('moment-timezone');

function asWholeWordEscaped(string) {
  return '^' + string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") + '$';
}

module.exports = {
  toArray: function (elem) {
    if (!elem) { return []; }
    if (elem instanceof Array) { return elem; }
    if (typeof elem === 'string') { return elem.split(','); }
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

  expressAppIn: function (directory) {
    var app = express();
    app.set('views', path.join(directory, 'views'));
    app.set('view engine', 'jade');
    return app;
  }
};

