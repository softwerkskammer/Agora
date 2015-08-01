'use strict';

var _ = require('lodash');

function groupAndSortAddonlines(addonLines) {
  return _(addonLines).sortBy(function (line) {
    return line.member.lastname();
  }).groupBy(function (line) {
    return line.member.lastname()[0].toUpperCase();
  }).value();
}

module.exports = {groupAndSortAddonlines: groupAndSortAddonlines};
