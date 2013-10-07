"use strict";

var beans = require('nconf').get('beans');
var statusmessage = beans.get('statusmessage');

module.exports = function expressViewHelper(req, res, next) {
  res.locals.calViewYear = req.session.calViewYear;
  res.locals.calViewMonth = req.session.calViewMonth;
  res.locals.user = req.user;
  res.locals.currentUrl = req.url;
  if (req.session.statusmessage) {
    statusmessage.fromObject(req.session.statusmessage).transferToLocals(req, res);
  }

  next();
};
