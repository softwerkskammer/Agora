'use strict';

var conf = require('simple-configure');
var beans = conf.get('beans');
var statusmessage = beans.get('statusmessage');
var logger = require('winston').loggers.get('application');

module.exports = function expressViewHelper(req, res, next) {
  if (req.session) {
    if (req.session.statusmessage) {
      statusmessage.fromObject(req.session.statusmessage).putIntoSession(req, res);
    }
    res.locals.language = req.session.language || 'en';
  }
  res.locals.user = req.user;
  if (!req.i18n) {
    logger.error('No i18n for ' + req.path + ' - make sure that the route is ignored in i18n.init() and that the file is present');
  } else {
    req.i18n.setLng(res.locals.language);
  }
  res.locals.currentUrl = req.url;
  res.locals.swkPublicUrl = conf.get('softwerkskammerURL');
  next();
};
