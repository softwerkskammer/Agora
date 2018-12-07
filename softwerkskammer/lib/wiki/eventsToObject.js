'use strict';

const beans = require('simple-configure').get('beans');
const misc = beans.get('misc');
const fieldHelpers = beans.get('fieldHelpers');

function contentsToObject(contents, year) {
  if (!contents) { return {}; }

  function titleAndLinkToObject(element) {
    const titleAndLink = element.replace(/[[)]/g, '').split(/\]\s*\(/);
    if (titleAndLink.length === 2) {
      return titleAndLink;
    }
  }

  function dates(element) {
    function toDate(dayMonthString) {
      const dayMonth = dayMonthString ? dayMonthString.split('.') : [];
      if (dayMonth.length < 2) {
        return null;
      }
      return fieldHelpers.parseToDateTimeUsingDefaultTimezone(dayMonthString + year);
    }

    if (element.trim()) {
      const fromAndUntil = misc.compact(element.split('-').map(each => each.trim()));
      const from = toDate(fromAndUntil[0]);
      if (!from) {
        return null;
      }
      const until = (fromAndUntil[1] ? toDate(fromAndUntil[1]) : from).plus({day: 1});
      if (from && until) {
        return [from.toISO(), until.toISO()];
      }
      return null;
    }
  }

  function lineToObject(line) {
    const elements = line.split('|');
    if (elements.length === 3) {
      const titleAndLink = titleAndLinkToObject(elements[0]);
      const fromUntil = dates(elements[2]);
      if (titleAndLink && fromUntil) {
        return {
          start: fromUntil[0],
          end: fromUntil[1],
          url: titleAndLink[1].trim(),
          title: titleAndLink[0].trim() + ' (' + elements[1].trim() + ')',
          color: '#999'
        };
      }
    }
  }

  const lines = contents.split(/[\n\r]/);
  return misc.compact(lines.map(lineToObject));
}

module.exports = contentsToObject;
