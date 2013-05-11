"use strict";

var path = require('path');
var conf = require('nconf');
var async = require('async');
var mailsAPI = conf.get('beans').get('mailsAPI');

module.exports = function (app) {

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.get('/list/:groupname', function (req, res, next) {
    mailsAPI.mailHeaders(
      {group: req.params.groupname},
      {timeUnix: -1},
      function (err, mailHeaders) {
        if (err) { return next(err); }
        async.each(mailHeaders, mailsAPI.addMemberNick, function (err) {
          if (err) { return next(err); }
          res.render('index', {group: req.params.groupname, mailHeaders: mailHeaders});
        });
      });
  });

  app.get('/show/:mailID', function (req, res, next) {
    mailsAPI.mailForId(req.params.mailID,
      function (err, mail) {
        if (err) { return next(err); }
        mailsAPI.addMemberNick(mail, function (err) {
          if (err) { return next(err); }
          res.render('message', {mail: mail});
        });
      });
  });

  return app;
};
