'use strict';

var conf = require('simple-configure');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn('/login');
var securedByLoginURLRegex = new RegExp(conf.get('securedByLoginURLPattern'));

module.exports = function secureByLogin(req, res, next) {
  if (securedByLoginURLRegex.test(req.originalUrl)) {
    return ensureLoggedIn(req, res, next);
  }
  next();
};
