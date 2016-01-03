'use strict';

var conf = require('simple-configure');
var beans = conf.get('beans');
var statusmessage = beans.get('statusmessage');

module.exports = function expressViewHelper(req, res, next) {
  if (req.session) {
    if (req.session.statusmessage) {
      statusmessage.fromObject(req.session.statusmessage).putIntoSession(req, res);
    }
    res.locals.language = req.session.language || 'en';
  }
  res.locals.user = req.user;
  res.locals.currentUrl = req.url;
  res.locals.swkPublicUrl = conf.get('softwerkskammerURL');
  next();
};
