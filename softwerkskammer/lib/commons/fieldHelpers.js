/* eslint no-underscore-dangle: 0 */

const moment = require('moment-timezone');

const conf = require('simple-configure');
const misc = conf.get('beans').get('misc');

// adding additional languages to builtin Intl
if (!require('intl-locales-supported')(['de', 'en-gb'])) {
  // `Intl` exists, but it doesn't have the data we need, so load the
  // polyfill and replace the constructors we need with the polyfill's.
  const IntlPolyfill = require('intl');
  Intl.NumberFormat = IntlPolyfill.NumberFormat;
  Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat;
}

module.exports = {
  isFilled: function isFilled(someValue) {
    return someValue !== undefined && someValue !== null && someValue !== 'undefined' &&
      (typeof someValue === 'string' ? someValue.trim().length > 0 : true);
  },

  valueOrFallback: function valueOrFallback(value, fallback) {
    return this.isFilled(value) ? value : fallback;
  },

  removePrefixFrom: function removePrefixFrom(prefix, string) {
    const regexp = new RegExp('^' + prefix);
    return string ? string.replace(regexp, '') : null;
  },

  addPrefixTo: function addPrefixTo(prefix, string, additionalPrefixToCheck) {
    if (string && !misc.startsWith(string, prefix) && !misc.startsWith(string, additionalPrefixToCheck)) {
      return prefix + string;
    }
    return string;
  },

  createLinkFrom: function createLinkFrom(fieldArray) {
    return fieldArray.join('_').replace(/[ #,!?ßöäü:"']/g, '_');
  },

  replaceMailAddresses: function replaceMailAddresses(text) {
    if (text) {
      return text.replace(/[\w.\-]+@[\w.\-]+\.[\w.\-]{2,3}(?!\w)/g, '...@...');
      // this means: some chars @ some chars . 2 or 3 chars, not followed by a char
      // where char = a-z A-Z 0-9 _ . -
    }
    return text;
  },

  replaceLongNumbers: function replaceLongNumbers(text) {
    if (text) {
      return text.replace(/[\-+()\/\d][\-()\/\d\s]{4,}[\-()\/\d]/g, '...');
      // this means: first we need a number or + or - or ( or ) or /
      // then we need the same or space, at least four times
      // last we need a number or - or ( or ) or /
    }
    return text;
  },

  killHtmlHead: function killHtmlHead(text) {
    if (text) {
      return text.replace(/<head>(?:\S|\s|\r)*<\/head>/, '');
    }
    return text;
  },

  readableDate: function readableDate(unixtimestamp) {
    return moment.unix(unixtimestamp).utc().format('DD.MM.YYYY');
  },

  parseToUnixUsingDefaultTimezone: function parseToUnixUsingDefaultTimezone(dateString, timeString) {
    const result = this.parseToMomentUsingDefaultTimezone(dateString, timeString);
    return result ? result.unix() : undefined;
  },

  parseToMomentUsingDefaultTimezone: function parseToMomentUsingDefaultTimezone(dateString, timeString) {
    return this.parseToMomentUsingTimezone(dateString, timeString, this.defaultTimezone());
  },

  parseToMomentUsingTimezone: function parseToMomentUsingTimezone(dateString, timeString, timezoneName) {
    if (dateString) {
      const timeStringOrDefault = timeString || '00:00';
      return moment.tz(dateString + ' ' + timeStringOrDefault, 'D.M.YYYY H:m', timezoneName);
    }
    return undefined;
  },

  defaultTimezone: function defaultTimezone() {
    return 'Europe/Berlin';
  },

  formatNumberWithCurrentLocale: function formatNumberWithCurrentLocale(res, number) {
    return new Intl.NumberFormat(res.locals.language, {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(number || 0);
  },

  parseNumberWithCurrentLocale: function parseNumberWithCurrentLocale(language, numberString) {
    return parseFloat(numberString.replace(',', '.'));
  },

  containsSlash: function containsSlash(string) {
    return (/\//).test(string);
  }

};
