"use strict";

var _s = require('underscore.string');

function Color(object) {
  if (object) {
    this.id = object.id.trim();
    this.color = _s.startsWith(object.color, '#') ? object.color : '#' + object.color;
  }
}

module.exports = Color;
