'use strict';

var beans = require('simple-configure').get('beans');
var mailarchiveService = beans.get('mailarchiveService');
var misc = beans.get('misc');

var app = misc.expressAppIn(__dirname);

function mailIndexRender(viewKind, req, res, next) {
  return function (err, mailHeaders) {
    if (err) { return next(err); }
    var view = mailHeaders.length === 0 ? 'indexNoMails' : viewKind;
    res.render(view, {group: req.params.groupname, mailHeaders: mailHeaders});
  };
}

app.get('/list/threaded/:groupname', function (req, res, next) {
  mailarchiveService.threadedMails(req.params.groupname, mailIndexRender('indexThreaded', req, res, next));
});

app.get('/list/flat/:groupname', function (req, res, next) {
  mailarchiveService.unthreadedMails(req.params.groupname, mailIndexRender('indexUnthreaded', req, res, next));
});

app.get('/message/:id', function (req, res, next) {
  mailarchiveService.mailForId(req.params.id,
    function (err, mail) {
      if (err) { return next(err); }
      res.render('message', {mail: mail});
    });
});

app.get('/puremessage/:id', function (req, res, next) {
  mailarchiveService.mailForId(req.params.id,
    function (err, mail) {
      if (err) { return next(err); }
      res.render('puremessage', {mail: mail});
    });
});

module.exports = app;
