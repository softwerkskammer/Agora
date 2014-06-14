'use strict';

module.exports = function addCsrfTokenToLocals(req, res, next) {
  res.locals.csrf_token = req.csrfToken();
  next();
};
