"use strict";

var async = require('async');
var conf = require('nconf');
var persistence = conf.get('beans').get('colorsPersistence');
var Color = conf.get('beans').get('color');

var toColor = function (callback, err, result) {
  if (err) {
    return callback(err);
  }
  if (result) {
    return callback(null, new Color(result));
  }
  callback(null, null);
};

var toColorList = function (callback, err, result) {
  if (err) {
    return callback(err);
  }
  async.map(result, function (each, cb) {
    cb(null, new Color(each));
  }, callback);
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
