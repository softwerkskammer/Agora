"use strict";
var useragent = require('useragent');
require('useragent/features');

module.exports = function detectBrowser(req, res, next) {
  var agent = useragent.parse(req.headers['user-agent']);
  res.locals.browserIsTooOld = agent.family === 'IE' && agent.satisfies('< 9');
  next();
};
