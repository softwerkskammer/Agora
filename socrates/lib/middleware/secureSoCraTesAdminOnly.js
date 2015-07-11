'use strict';

var conf = require('simple-configure');
var logger = require('winston').loggers.get('authorization');
var securedBySoCraTesAdminURLRegex = new RegExp(conf.get('securedBySoCraTesAdminURLPattern'));

module.exports = function redirectIfNotSuperuser(req, res, next) {
  var originalUrl = req.originalUrl;
  var user = req.user;

  if (securedBySoCraTesAdminURLRegex && securedBySoCraTesAdminURLRegex.test(originalUrl)) {
    if (!res.locals.accessrights.isSoCraTesAdmin()) {
      logger.info('Someone tried to access SoCraTes-Admin protected page ' + originalUrl + ' ' + (user ? ' - User was: ' + user.authenticationId : ''));
      return res.redirect('/mustBeSoCraTesAdmin?page=' + encodeURIComponent(conf.get('publicUrlPrefix') + originalUrl));
    }
  }
  next();
};
