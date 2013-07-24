"use strict";

var async = require('async');
var _ = require('underscore');
var beans = require('nconf').get('beans');
var persistence = beans.get('colorsPersistence');
var Color = beans.get('color');
var misc = beans.get('misc');

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
    persistence.getByField({id: misc.toLowerCaseRegExp(id)}, async.apply(toColor, callback));
  },
  saveColor: function (color, callback) {
    persistence.save(color, callback);
  },

  saveAllColors: function (colors, callback) {
    persistence.saveAll(colors, callback);
  }

};
