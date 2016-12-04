'use strict';
const useragent = require('useragent');

module.exports = function detectBrowser(req, res, next) {
  const agent = useragent.parse(req.headers['user-agent']);
  res.locals.browserIsTooOld = agent.family === 'IE' && agent.major < 9;
  next();
};
