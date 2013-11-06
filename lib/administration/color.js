"use strict";

function Color(object) {
  if (object) {
    this.id = object.id.trim();
    this.color = object.color;
  }
}

module.exports = Color;
