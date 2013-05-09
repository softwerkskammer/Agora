"use strict";

var path = require('path');
var conf = require('nconf');

var mailsAPI = conf.get('beans').get('mailsAPI');

module.exports = function (app) {

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.get('/list/:groupname/:year/:month', function (req, res, next) {
    mailsAPI.mailHeaders4groupAndMonth(
      {group: req.params.groupname, year: req.params.year, month: req.params.month},
      function (err, mailHeaders) {
        if (err) { return next(err); }
        res.render('index', {group: req.params.groupname, mailHeaders: mailHeaders});
      });
  });

  app.get('/show/:mailID', function (req, res, next) {
    mailsAPI.mailForId(req.params.mailID,
      function (err, mail) {
        if (err) { return next(err); }
        res.render('message', {mail: mail});
      });
  });

  return app;
};
