'use strict';

var conf = require('simple-configure');
var logger = require('winston').loggers.get('authorization');
var securedBySuperuserURLRegex = new RegExp(conf.get('securedBySuperuserURLPattern'));

module.exports = function redirectIfNotSuperuser(req, res, next) {
  var originalUrl = req.originalUrl;
  var user = req.user;

  if (securedBySuperuserURLRegex.test(originalUrl)) {
    if (!res.locals.accessrights.isSuperuser()) {
      logger.info('Someone tried to access superuser protected page ' + originalUrl + ' ' + (user ? ' - User was: ' + user.authenticationId : ''));
      return res.redirect('/mustBeSuperuser?page=' + encodeURIComponent(conf.get('publicUrlPrefix') + originalUrl));
    }
  }
  next();
};
