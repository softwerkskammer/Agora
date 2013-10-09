"use strict";

var _s = require('underscore.string');
var crypto = require('crypto');
var moment = require('moment-timezone');

function parseAssumingUtc(dateString, timeString) {
  var timeStringOrDefault = timeString || '00:00';
  return moment.utc(dateString + " " + timeStringOrDefault, 'D.M.YYYY H:m');
}

// Converts `sourceMoment` into a moment in `timezone` with the same local time.
// Example: "2013-01-02T03:04:00+00:00" will result in "2013-01-02T03:04:00+01:00"
//          when used with timezone "Europe/Berlin".
// Eventually, moment-timezone should be able to do this for us:
// <https://github.com/moment/moment-timezone/issues/11>
function toMomentInTimezone(sourceMoment, timezone) {
  var result = moment.tz(timezone);
  result.year(sourceMoment.year());
  result.month(sourceMoment.month());
  result.date(sourceMoment.date());
  result.hour(sourceMoment.hour());
  result.minute(sourceMoment.minute());
  result.second(sourceMoment.second());
  result.millisecond(sourceMoment.millisecond());
  return result;
}

module.exports = {
  isFilled: function (someValue) {
    return someValue !== undefined && someValue !== null && someValue !== 'undefined' &&
      (typeof (someValue) === 'string' ? someValue.trim().length > 0 : true);
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

  replaceLongNumbers: function (text) {
    if (text) {
      return text.replace(/[-+()\/\d][-()\/\d\s]{4,}[-()\/\d]/g, '...');
      // this means: first we need a number or + or - or ( or ) or /
      // then we need the same or space, at least four times
      // last we need a number or - or ( or ) or /
    }
    return text;
  },

  killHtmlHead: function (text) {
    if (text) {
      return text.replace(/<head>(?:.|\n|\r)*<\/head>/, "");
    }
    return text;
  },

  readableDate: function (unixtimestamp) {
    return this.readableDateFromMoment(moment.unix(unixtimestamp).utc());
  },

  readableDateFromMoment: function (sourceMoment) {
    return sourceMoment.format('DD.MM.YYYY');
  },

  readableTime: function (unixtimestamp) {
    return this.readableTimeFromMoment(moment.unix(unixtimestamp).utc());
  },

  readableTimeFromMoment: function (sourceMoment) {
    return sourceMoment.format('HH:mm');
  },

  parseToUnixUsingDefaultTimezone: function (dateString, timeString) {
    var result = this.parseToMomentUsingDefaultTimezone(dateString, timeString);
    return result ? result.unix() : undefined;
  },

  parseToMomentUsingDefaultTimezone: function (dateString, timeString) {
    return this.parseToMomentUsingTimezone(dateString, timeString, this.defaultTimezone());
  },

  parseToMomentUsingTimezone: function (dateString, timeString, timezoneName) {
    if (dateString) {
      var utcBasedMoment = parseAssumingUtc(dateString, timeString);
      return toMomentInTimezone(utcBasedMoment, timezoneName);
    }
  },

  defaultTimezone: function () {
    return 'Europe/Berlin';
  }

};
