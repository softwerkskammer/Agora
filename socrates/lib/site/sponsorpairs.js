'use strict';

const sponsors = require('./sponsors.json');
const _ = require('lodash');

function composePairs() {
  let pair = {};
  return _(sponsors).shuffle().transform((result, sponsor, index) => {
    if (index % 2) {
      pair.second = sponsor;
    } else {
      pair = {};
      pair.first = sponsor;
      result.push(pair);
    }
    return result;
  }).value();
}
module.exports = composePairs;
