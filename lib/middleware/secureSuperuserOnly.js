"use strict";

var conf = require('nconf');
var winston = require('winston');
var logger = winston.loggers.get('authorization');
var superuserURLRegex = new RegExp(conf.get('superuserURLPattern'));

module.exports = function redirectIfNotSuperuser(req, res, next) {
  var isAuthenticated = res.locals.accessrights.isAuthenticated();
  var userNeedsNotBeSuperuser = false;
  var originalUrl = req.originalUrl;
  var user = req.user;

  if (isAuthenticated) {
    if (/wiki/.test(originalUrl)) {
      userNeedsNotBeSuperuser = true;
    }
  }

  if (superuserURLRegex.test(originalUrl)) {
    if (!userNeedsNotBeSuperuser && !res.locals.accessrights.isSuperuser()) {
      logger.info('Someone tried to access superuser protected page.' + (user ? ' - User was: ' + user.authenticationId : ''));
      return res.redirect("/mustBeSuperuser?page=" + encodeURIComponent(conf.get('publicUrlPrefix') + originalUrl));
    }
  }
  next();
};
