const {DateTime} = require('luxon');
const beans = require('simple-configure').get('beans');
const statusmessage = beans.get('statusmessage');
const membersService = beans.get('membersService');

module.exports = function expressViewHelper(req, res, next) {
  res.locals.language = 'de';
  if (req.session) {
    if (req.session.statusmessage) {
      statusmessage.fromObject(req.session.statusmessage).putIntoSession(req, res);
    }
    res.locals.language = req.session.language || 'de';
  }
  res.locals.user = req.user;
  res.locals.currentUrl = req.url;
  res.locals.tagclouddata = membersService.toWordList;
  res.locals.DateTime = DateTime;
  next();
};
