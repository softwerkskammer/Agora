'use strict';

module.exports = function (user) {

  var userStub = function (req, res, next) {
    req.user = user || {}; // for model checks
    res.locals.user = req.user; // for jade checks
    req.isAuthenticated = function () { return true; };
    next();
  };

  return userStub;
};

