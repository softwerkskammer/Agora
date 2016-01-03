'use strict';

var beans = require('simple-configure').get('beans');
var statusmessage = beans.get('statusmessage');
var membersService = beans.get('membersService');

module.exports = function expressViewHelper(req, res, next) {
  res.locals.language = 'de';
  if (req.session) {
    res.locals.calViewYear = req.session.calViewYear;
    res.locals.calViewMonth = req.session.calViewMonth;
    if (req.session.statusmessage) {
      statusmessage.fromObject(req.session.statusmessage).putIntoSession(req, res);
    }
    res.locals.language = req.session.language || 'de';
  }
  res.locals.user = req.user;
  res.locals.currentUrl = req.url;
  res.locals.tagclouddata = membersService.toWordList;
  next();
};
