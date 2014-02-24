"use strict";

module.exports = function (req, res, next) {
  res.locals.removeServerpaths = function (msg) {
    var regex = /\/[^ ]*?\/((node_modules|lib)\/[^ ]*)/g;
    return msg.replace(regex, '$1');
  };
  next();
};
