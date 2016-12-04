'use strict';

const beans = require('simple-configure').get('beans');
const mailarchiveService = beans.get('mailarchiveService');
const misc = beans.get('misc');

const app = misc.expressAppIn(__dirname);

function mailIndexRender(viewKind, req, res, next) {
  return (err, mailHeaders) => {
    if (err) { return next(err); }
    const view = mailHeaders.length === 0 ? 'indexNoMails' : viewKind;
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
  mailarchiveService.mailForId(req.params.id, (err, mail) => {
      if (err) { return next(err); }
      res.render('message', {mail: mail});
    });
});

app.get('/puremessage/:id', function (req, res, next) {
  mailarchiveService.mailForId(req.params.id, (err, mail) => {
      if (err) { return next(err); }
      res.render('puremessage', {mail: mail});
    });
});

module.exports = app;
