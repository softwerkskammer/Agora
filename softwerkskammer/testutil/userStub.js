"use strict";

module.exports = function (user) {
  return function (req, res, next) {
    req.user = user || {}; // for model checks
    res.locals.user = req.user; // for pug checks
    req.isAuthenticated = function () {
      return !!req.user.member;
    }; // for secureByLogin checks
    next();
  };
};
