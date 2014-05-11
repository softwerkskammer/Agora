"use strict";

var conf = require('nconf');
var logger = require('winston').loggers.get('authorization');

module.exports = function redirectIfNotSuperuser(req, res, next) {
  var startsWithAdministration = /^\/administration\//;
  var originalUrl = req.originalUrl;
  var user = req.user;

  if (startsWithAdministration.test(originalUrl)) {
    if (!res.locals.accessrights.isSuperuser()) {
      logger.info('Someone tried to access superuser protected page.' + (user ? ' - User was: ' + user.authenticationId : ''));
      return res.redirect("/mustBeSuperuser?page=" + encodeURIComponent(conf.get('publicUrlPrefix') + originalUrl));
    }
  }
  next();
};
