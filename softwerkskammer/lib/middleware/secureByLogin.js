'use strict';

var conf = require('simple-configure');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn('/login');
var securedByLoginURLRegex = new RegExp(conf.get('securedByLoginURLPattern'));

module.exports = function secureByLogin(req, res, next) {
  if (securedByLoginURLRegex.test(req.originalUrl)) {
    if (req.method === 'POST') {
      req.session.previousBody = req.body;
    }
    return ensureLoggedIn(req, res, next);
  }
  next();
};
