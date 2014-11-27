'use strict';

var sponsors = require('./sponsors.json');
var _ = require('lodash');

function composePairs() {
  var pair = {};
  return _(sponsors).shuffle().transform(function (result, sponsor, index) {
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
