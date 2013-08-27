"use strict";
var Iconv = require("iconv").Iconv;

var iconv = new Iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE');

exports.normalize = function (str) {
  if (!str || str.trim() === "") {
    return "";
  }
  return iconv.convert(str).toString().replace(/\s/g, '-').replace(/\//g, '-').replace(/[^a-zA-Z0-9\- _]/g, "").toLowerCase();
};
