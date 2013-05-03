"use strict";

var conf = require('nconf');
var securedByLoginURLRegex = new RegExp(conf.get('securedByLoginURLPattern'));
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn('/auth/login');

module.exports = function secureByLogin(req, res, next) {
  if (securedByLoginURLRegex.test(req.originalUrl)) {
    return ensureLoggedIn(req, res, next);
  }
  next();
};
