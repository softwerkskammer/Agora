'use strict';

const R = require('ramda');

module.exports = {
  groupAndSortAddonlines: addonLines => R.groupBy(line => line.member.lastname()[0].toUpperCase(), R.sortBy(line => line.member.lastname(), addonLines))
};
