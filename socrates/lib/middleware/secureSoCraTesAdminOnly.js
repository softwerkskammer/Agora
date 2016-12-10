'use strict';

const conf = require('simple-configure');
const logger = require('winston').loggers.get('authorization');
const securedBySoCraTesAdminURLRegex = new RegExp(conf.get('securedBySoCraTesAdminURLPattern'));

module.exports = function redirectIfNotSuperuser(req, res, next) {
  const originalUrl = req.originalUrl;
  const user = req.user;

  if (securedBySoCraTesAdminURLRegex && securedBySoCraTesAdminURLRegex.test(originalUrl)) {
    if (!res.locals.accessrights.isSoCraTesAdmin()) {
      logger.info('Someone tried to access SoCraTes-Admin protected page ' + originalUrl + ' ' + (user ? ' - User was: ' + user.authenticationId : ''));
      return res.redirect('/mustBeSoCraTesAdmin?page=' + encodeURIComponent(conf.get('publicUrlPrefix') + originalUrl));
    }
  }
  next();
};
