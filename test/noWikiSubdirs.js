"use strict";

module.exports = function subdirs(req, res, next) {
  res.locals.wikisubdirs = [];
  next();
};
