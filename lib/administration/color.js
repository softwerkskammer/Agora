"use strict";

var fieldHelpers = require('nconf').get('beans').get('fieldHelpers');

function Color(object) {
  if (object) {
    this.id = object.id.trim();
    this.color = fieldHelpers.addPrefixTo('#', object.color);
  }
}

module.exports = Color;
