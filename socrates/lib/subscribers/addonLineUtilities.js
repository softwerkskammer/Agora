'use strict';

var _ = require('lodash');

function groupAndSortAddonlines(addonLines) {
  return _(addonLines).sortBy(line => line.member.lastname()).groupBy(line => line.member.lastname()[0].toUpperCase()).value();
}

module.exports = {groupAndSortAddonlines: groupAndSortAddonlines};
