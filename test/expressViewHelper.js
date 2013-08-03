"use strict";

module.exports = function expressViewHelper(req, res, next) {
  res.locals.user = req.user;
  res.locals.currentUrl = req.url;
  res.locals.i18n = req.i18n;
  next();
};
