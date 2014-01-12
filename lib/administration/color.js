"use strict";

var conf = require('nconf');
var fieldHelpers = conf.get('beans').get('fieldHelpers');

function Color(object) {
  if (object) {
    this.id = object.id.trim();
    this.color = fieldHelpers.addPrefixTo('#', object.color);
  }
}

module.exports = Color;
