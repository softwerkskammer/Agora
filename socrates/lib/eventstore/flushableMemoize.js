'use strict';

var toString = require('ramda').toString;

function memoize(fn) {
  fn.globalCache = {};
  var flushGlobalCache = function() {
    fn.globalCache = {};
  };

  var chooseCache = function(that) {
    if (that) {
      that.memoizeInstanceCache = that.memoizeInstanceCache || {};
      return that.memoizeInstanceCache;
    }
    return fn.globalCache;
  };

  var memoizedFn = function() {
    if (memoizedFn.flushCache === flushGlobalCache) {
      var that = this;
      memoizedFn.flushCache = function flushGlobalAndLocalCache() {
        if (that && that.memoizeInstanceCache) {
          that.memoizeInstanceCache = {};
        }
        flushGlobalCache();
      };
    }

    var cache = chooseCache(this);
    // Smart toString from http://ramdajs.com/docs/#toString
    var key = toString([fn, arguments]);

    if (!cache.hasOwnProperty(key)) {
      cache[key] = fn.apply(this, arguments);
    }
    return cache[key];
  };

  memoizedFn.flushCache = flushGlobalCache;

  return memoizedFn;
}

module.exports = memoize;
