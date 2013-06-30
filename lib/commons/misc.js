"use strict";

module.exports = {
  toArray: function (elem) {
    if (!elem) { return []; }
    if (elem instanceof Array) { return elem; }
    return [ elem ];
  }
};
