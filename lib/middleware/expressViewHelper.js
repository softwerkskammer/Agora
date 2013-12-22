"use strict";

var beans = require('nconf').get('beans');
var statusmessage = beans.get('statusmessage');

module.exports = function expressViewHelper(req, res, next) {
  res.locals.language = 'de';
  if (req.session) {
    res.locals.calViewYear = req.session.calViewYear;
    res.locals.calViewMonth = req.session.calViewMonth;
    if (req.session.statusmessage) {
      statusmessage.fromObject(req.session.statusmessage).transferToLocals(req, res);
    }
    res.locals.language = req.session.language || 'de';
  }
  res.locals.user = req.user;
  res.locals.currentUrl = req.url;
  req.i18n.setLng(res.locals.language);
  next();
};
