"use strict";

module.exports = function (appLogger) {
  return function (error, req, res, next) {
    appLogger.error(error.stack);
    if (/InternalOpenIDError|BadRequestError|InternalOAuthError/.test(error.name)) {
      return res.render('errorPages/authenticationError.jade', {error: error});
    }
    res.render('errorPages/500.jade', {error: error});
    next; // needed for jshint
  };
};
