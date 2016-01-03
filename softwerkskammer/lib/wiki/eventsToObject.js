'use strict';

var _ = require('lodash');
var moment = require('moment-timezone');

function contentsToObject(contents, year) {
  if (!contents) { return {}; }

  function titleAndLinkToObject(element) {
    var titleAndLink = element.replace(/[\[\)]/g, '').split(/\]\s*\(/);
    if (titleAndLink.length === 2) {
      return titleAndLink;
    }
  }

  function dates(element) {
    if (element.trim()) {
      var fromAndUntil = _(element.split('-')).map(function (each) { return each.trim(); }).compact().value();
      var from = moment.utc(fromAndUntil[0] + year, 'D.M.YYYY');
      var until = moment.utc((fromAndUntil[1] || fromAndUntil[0]) + year, 'D.M.YYYY');
      until.add(23, 'hours');
      return [from.format(), until.format()];
    }
  }

  function lineToObject(line) {
    var elements = line.split('|');
    if (elements.length === 3) {
      var titleAndLink = titleAndLinkToObject(elements[0]);
      var fromUntil = dates(elements[2]);
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

  var lines = contents.split(/[\n\r]/);
  return _(lines).map(lineToObject).compact().value();
}

module.exports = contentsToObject;
