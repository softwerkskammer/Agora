/* eslint no-underscore-dangle: 0 */

const { DateTime } = require("luxon");
const conf = require("simple-configure");
const misc = conf.get("beans").get("misc");

module.exports = {
  isFilled: function isFilled(someValue) {
    return (
      someValue !== undefined &&
      someValue !== null &&
      someValue !== "undefined" &&
      (typeof someValue === "string" ? someValue.trim().length > 0 : true)
    );
  },

  valueOrFallback: function valueOrFallback(value, fallback) {
    return this.isFilled(value) ? value : fallback;
  },

  removePrefixFrom: function removePrefixFrom(prefix, string) {
    const regexp = new RegExp("^" + prefix);
    return string ? string.replace(regexp, "") : null;
  },

  addPrefixTo: function addPrefixTo(prefix, string, additionalPrefixToCheck) {
    if (string && !misc.startsWith(string, prefix) && !misc.startsWith(string, additionalPrefixToCheck)) {
      return prefix + string;
    }
    return string;
  },

  createLinkFrom: function createLinkFrom(fieldArray) {
    return fieldArray.join("_").replace(/[ #,!?ßöäü:"']/g, "_");
  },

  replaceMailAddresses: function replaceMailAddresses(text) {
    if (text) {
      return text.replace(/[\w.-]+@[\w.-]+\.[\w.-]{2,3}(?!\w)/g, "...@...");
      // this means: some chars @ some chars . 2 or 3 chars, not followed by a char
      // where char = a-z A-Z 0-9 _ . -
    }
    return text;
  },

  replaceLongNumbers: function replaceLongNumbers(text) {
    if (text) {
      return text.replace(/[-+()/\d][-()/\d\s]{4,}[-()/\d]/g, "...");
      // this means: first we need a number or + or - or ( or ) or /
      // then we need the same or space, at least four times
      // last we need a number or - or ( or ) or /
    }
    return text;
  },

  killHtmlHead: function killHtmlHead(text) {
    if (text) {
      return text.replace(/<head>(?:\S|\s|\r)*<\/head>/, "");
    }
    return text;
  },

  parseToUnixUsingDefaultTimezone: function parseToUnixUsingDefaultTimezone(dateString, timeString) {
    const result = this.parseToDateTimeUsingDefaultTimezone(dateString, timeString);
    return result ? result.toMillis() / 1000 : undefined;
  },

  parseToDateTimeUsingDefaultTimezone: function parseToUsingDefaultTimezone(dateString, timeString) {
    return this.parseToDateTimeUsingTimezone(dateString, timeString, this.defaultTimezone());
  },

  parseToDateTimeUsingTimezone: function parseToDateTimeUsingTimezone(dateString, timeString, timezoneName) {
    if (dateString) {
      const timeStringOrDefault = timeString || "00:00";
      // HACK to follow
      const dateformat = dateString && dateString.indexOf("/") > -1 ? "d/M/yyyy" : "d.M.yyyy";
      return DateTime.fromFormat(dateString + " " + timeStringOrDefault, `${dateformat} H:m`, { zone: timezoneName });
    }
    return undefined;
  },

  meetupDateToActivityTimes: function meetupDateToActivityTimes(meetupStartDate, meetupStartTime, durationInMillis) {
    DateTime.fromFormat(meetupStartDate + " " + meetupStartTime, "yyyy-MM-dd H:m", { zone: this.defaultTimezone() });
    const startPoint = DateTime.fromFormat(meetupStartDate + " " + meetupStartTime, "yyyy-MM-dd H:m", {
      zone: this.defaultTimezone(),
    });
    const endPoint = startPoint.plus({ seconds: durationInMillis / 1000 });

    return {
      startDate: startPoint.toFormat("dd.MM.yyyy"),
      startTime: startPoint.toFormat("HH:mm"),
      endDate: endPoint.toFormat("dd.MM.yyyy"),
      endTime: endPoint.toFormat("HH:mm"),
    };
  },

  defaultTimezone: function defaultTimezone() {
    return "Europe/Berlin";
  },

  formatNumberWithCurrentLocale: function formatNumberWithCurrentLocale(res, number) {
    return new Intl.NumberFormat(res.locals.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
      number || 0
    );
  },

  parseNumberWithCurrentLocale: function parseNumberWithCurrentLocale(language, numberString) {
    return parseFloat(numberString.replace(",", "."));
  },

  containsSlash: function containsSlash(string) {
    return /\//.test(string);
  },
};
