'use strict';

var conf = require('nconf');
var store = conf.get('beans').get('colorstore');

module.exports = {
  saveColor: function (color, callback) {
    store.saveColor(color, callback);
  },

  saveColors: function (colors, callback) {
    store.saveAllColors(colors, function (err) {
      if (err) { return callback(err); }
      callback(null, colors);
    });
  },

  allColors: function (callback) {
    store.allColors(callback);
  }
};
