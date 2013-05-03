"use strict";

function Color(object) {
  if (object) {
    this.id = object.id;
    this.color = object.color;
  }
}

module.exports = Color;
