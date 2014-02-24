"use strict";

module.exports = function (appLogger) {
  return function (error, req, res, next) {
    next; // we need four method params in order to get the error message, and JSHint complains if the fourth one is not used...

    appLogger.error(error.stack);
    if (/InternalOpenIDError|BadRequestError|InternalOAuthError/.test(error.name)) {
      return res.render('errorPages/authenticationError.jade', {error: error});
    }
    res.render('errorPages/500.jade', {error: error});
  };
};
