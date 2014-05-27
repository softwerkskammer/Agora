'use strict';

var _ = require('lodash');
var beans = require('nconf').get('beans');
var persistence = beans.get('colorsPersistence');
var Color = beans.get('color');
var misc = beans.get('misc');

var toColor = _.partial(misc.toObject, Color);
var toColorList = _.partial(misc.toObjectList, Color);

module.exports = {
  allColors: function (callback) {
    persistence.list({id: 1}, _.partial(toColorList, callback));
  },
  getColor: function (id, callback) {
    persistence.getByField({id: misc.toLowerCaseRegExp(id)}, _.partial(toColor, callback));
  },
  saveColor: function (color, callback) {
    persistence.save(color, callback);
  },

  saveColors: function (colors, callback) {
    persistence.saveAll(colors, callback);
  }

};
