'use strict';

var toString = require('ramda').toString;

function memoize(fn) {
  var cache = {};

  var memoizedFn = function() {
    // Smart toString from http://ramdajs.com/docs/#toString
    var key = toString(arguments);

    if (!cache.hasOwnProperty(key)) {
      cache[key] = fn.apply(this, arguments);
    }
    return cache[key];
  };

  memoizedFn.flushCache = function() {
    cache = {};
  };

  return memoizedFn;
}

module.exports = memoize;
