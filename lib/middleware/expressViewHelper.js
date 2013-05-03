"use strict";

module.exports = function expressViewHelper(req, res, next) {
  res.locals.calViewYear = req.session.calViewYear;
  res.locals.calViewMonth = req.session.calViewMonth;
  res.locals.user = req.user;
  res.locals.currentUrl = req.url;
  next();
};
