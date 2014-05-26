"use strict";

var conf = require('nconf');
var beans = conf.get('beans');
var mailarchiveAPI = beans.get('mailarchiveAPI');
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

module.exports = app;
