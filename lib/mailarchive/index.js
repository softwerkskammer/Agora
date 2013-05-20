"use strict";

var path = require('path');
var conf = require('nconf');
var async = require('async');
var mailarchiveAPI = conf.get('beans').get('mailarchiveAPI');

module.exports = function (app) {

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.get('/list/:groupname', function (req, res, next) {
    mailarchiveAPI.mailHeaders(
      {group: req.params.groupname},
      {timeUnix: -1},
      function (err, mailHeaders) {
        if (err) { return next(err); }
        mailarchiveAPI.addMemberNicks(mailHeaders, function (err) {
          if (err) { return next(err); }
          res.render('index', {group: req.params.groupname, mailHeaders: mailHeaders});
        });
      });
  });

  app.get('/message', function (req, res, next) {
    var id = req.query.id;
    if (!id) {
      return res.send(404);
    }
    mailarchiveAPI.mailForId(id,
      function (err, mail) {
        if (err) { return next(err); }
        mailarchiveAPI.addMemberNick(mail, function (err) {
          if (err) { return next(err); }
          res.render('message', {mail: mail});
        });
      });
  });

  return app;
};
