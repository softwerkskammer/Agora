"use strict";

var async = require('async');
var _ = require('underscore');
var conf = require('nconf');
var persistence = conf.get('beans').get('colorsPersistence');
var Color = conf.get('beans').get('color');

var toColor = function (callback, err, color) {
  if (err) {return callback(err); }
  if (color) { return callback(null, new Color(color)); }
  callback(null, null);
};

var toColorList = function (callback, err, colors) {
  if (err) { return callback(err); }
  callback(null, _.map(colors, function (each) { return new Color(each); }));
};

module.exports = {
  allColors: function (callback) {
    persistence.list({id: 1}, async.apply(toColorList, callback));
  },
  getColor: function (id, callback) {
    persistence.getByField({id: new RegExp('^' + id + '$', 'i')}, async.apply(toColor, callback));
  },
  saveColor: function (color, callback) {
    persistence.save(color, callback);
  },

  saveAllColors: function (colors, callback) {
    persistence.saveAll(colors, callback);
  }

};
