'use strict';

const conf = require('simple-configure');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn('/login');
const securedByLoginURLRegex = new RegExp(conf.get('securedByLoginURLPattern'));

module.exports = function secureByLogin(req, res, next) {
  if (securedByLoginURLRegex.test(req.originalUrl)) {
    if (req.method === 'POST') {
      req.session.previousBody = req.body;
    }
    return ensureLoggedIn(req, res, next);
  }
  next();
};
