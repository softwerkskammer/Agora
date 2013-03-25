"use strict";

var path = require('path');

module.exports = function (location) {
  var dir = path.join(__dirname, location);

  return {
    store: require('store')(dir),

    list: function (callback) {
      this.store.list(function (err, result) {
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

    /* store seems to use blocking i/o, so no callback is needed */
    save: function (object) {
      this.store.add(object, function (err) {
        if (err) {
          throw err;
        }
      });
    }
  };

};
