'use strict';

module.exports = function (req, res, next) {
  res.locals.removeServerpaths = function (msg) { return msg; };
  next();
};

