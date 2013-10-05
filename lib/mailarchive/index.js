"use strict";

var path = require('path');
var conf = require('nconf');
var mailarchiveAPI = conf.get('beans').get('mailarchiveAPI');

module.exports = function (app) {

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  function mailIndexRender(viewKind, req, res, next) {
    return function (err, mailHeaders) {
      if (err) { return next(err); }
      var view = mailHeaders.length === 0 ? 'indexNoMails' : viewKind;
      res.render(view, {group: req.params.groupname, mailHeaders: mailHeaders});
    };
  }

  app.get('/list/threaded/:groupname', function (req, res, next) {
    mailarchiveAPI.threadedMails(req.params.groupname, mailIndexRender('indexThreaded', req, res, next));
  });

  app.get('/list/flat/:groupname', function (req, res, next) {
    mailarchiveAPI.unthreadedMails(req.params.groupname, mailIndexRender('indexUnthreaded', req, res, next));
  });

  app.get('/message/:id', function (req, res, next) {
    mailarchiveAPI.mailForId(req.params.id,
      function (err, mail) {
        if (err) { return next(err); }
        res.render('message', {mail: mail});
      });
  });

  return app;
};
