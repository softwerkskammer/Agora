"use strict";

var path = require('path');

module.exports = function (location) {
  var dir = path.join(__dirname, location);

  return {
    store: require('store')(dir),

    list: function (callback) {
      this.store.list(function (err, result) {
        /* TODO Do we really want this or don't we want to use an error aware callback, like
         * callback(err, result) */
        if (err) {
          throw err;
        }
        callback(result);
      });
    },

    getById: function (id, callback) {
      this.list(function (results) {
        var matchingResults = results.filter(function (result) {
          return result.id === id;
        });
        callback(matchingResults[0]);
      });
    },

    save: function (object, callback) {
      this.store.add(object, function (err) {
        /* TODO Do we really want this or don't we want to use an error aware callback, like
         * callback(err) */
        if (err) {
          throw err;
        }
        callback();
      });
    }
  };

};
