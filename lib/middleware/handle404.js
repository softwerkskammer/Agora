"use strict";

module.exports = function (appLogger) {
  return function (req, res) {
    appLogger.error('404 - requested url was ' + req.url);
    res.render('errorPages/404.jade');
  };
};
