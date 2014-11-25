'use strict';

var beans = require('nconf').get('beans');
var statusmessage = beans.get('statusmessage');

module.exports = function expressViewHelper(req, res, next) {
  if (req.session) {
    if (req.session.statusmessage) {
      statusmessage.fromObject(req.session.statusmessage).putIntoSession(req, res);
    }
  }
  res.locals.user = req.user;
  req.i18n.setLng('en');
//  res.locals.currentUrl = req.url;
  next();
};
