"use strict";

var path = require('path');

module.exports = function (location) {
  var dir = path.join(__dirname, location);

  return {
    store: require('store')(dir),

    list: function (callback) {
      this.store.list(function (err, result) {
        if (err) {
          return callback(err);
        }
        callback(null, result);
      });
    },

    getById: function (id, callback) {
      this.list(function (err, results) {
        if (err) {
          return callback(err);
        }
        var matchingResults = results.filter(function (result) {
          return result.id === id;
        });
        callback(null, matchingResults[0]);
      });
    },

    save: function (object, callback) {
      this.store.add(object, function (err) {
        if (err) {
          return callback(err);
        }
        callback(null);
      });
    }
  };

};
