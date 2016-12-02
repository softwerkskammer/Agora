'use strict';

const moment = require('moment-timezone');
const misc = require('../commons/misc');

function contentsToObject(contents, year) {
  if (!contents) { return {}; }

  function titleAndLinkToObject(element) {
    const titleAndLink = element.replace(/[\[\)]/g, '').split(/\]\s*\(/);
    if (titleAndLink.length === 2) {
      return titleAndLink;
    }
  }

  function dates(element) {
    if (element.trim()) {
      const fromAndUntil = misc.compact(element.split('-').map(each => each.trim()));
      const from = moment.utc(fromAndUntil[0] + year, 'D.M.YYYY');
      const until = moment.utc((fromAndUntil[1] || fromAndUntil[0]) + year, 'D.M.YYYY');
      until.add(23, 'hours');
      return [from.format(), until.format()];
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
