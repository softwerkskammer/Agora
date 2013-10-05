"use strict";

var _s = require('underscore.string');
var crypto = require('crypto');
var moment = require('moment-timezone');

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

  readableDate: function (unixtimestamp) {
    return moment.unix(unixtimestamp).utc().format('DD.MM.YYYY');
  },

  readableTime: function (unixtimestamp) {
    return moment.unix(unixtimestamp).utc().format('HH:mm');
  },

  convertUtcToBerlinMoment: function (unixSecondsUtcBased) {
    var berlinBasedMoment = moment.tz('Europe/Berlin');
    var utcBasedMoment = moment.unix(unixSecondsUtcBased).utc();
    berlinBasedMoment.year(utcBasedMoment.year());
    berlinBasedMoment.month(utcBasedMoment.month());
    berlinBasedMoment.date(utcBasedMoment.date());
    berlinBasedMoment.hour(utcBasedMoment.hour());
    berlinBasedMoment.minute(utcBasedMoment.minute());
    berlinBasedMoment.second(utcBasedMoment.second());
    return berlinBasedMoment.toDate();

  }

};
