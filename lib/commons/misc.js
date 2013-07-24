"use strict";

function escapeForRegExp(string) {
  return string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

module.exports = {
  toArray: function (elem) {
    if (!elem) { return []; }
    if (elem instanceof Array) { return elem; }
    if (typeof(elem) === 'string') { return elem.split(','); }
    return [ elem ];
  },

  toLowerCaseRegExp: function (string) {
    return new RegExp('^' + escapeForRegExp(string) + '$', 'i');
  }
};

