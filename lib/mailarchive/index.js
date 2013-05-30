"use strict";

var path = require('path');
var conf = require('nconf');
var mailarchiveAPI = conf.get('beans').get('mailarchiveAPI');

module.exports = function (app) {

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  function mailIndexRender(thread, req, res, next) {
    return function (err, mailHeaders) {
      if (err) { next(err); return; }
      mailarchiveAPI.addMemberNicks(mailHeaders, function (err) {
        if (err) { next(err); return; }
        res.render('index', {group: req.params.groupname, mailHeaders: mailHeaders, threaded: thread});
      });
    };
  }

  app.get('/list/:groupname', function (req, res, next) {
    var thread = req.query.thread === 'true' ||  req.query.thread !== 'false' && req.session.mailarchive_thread;
    if (thread) {
      req.session.mailarchive_thread = true;
      mailarchiveAPI.threadedMails(req.params.groupname,
        mailarchiveAPI.sortOnThreadModificationTimeDescending,
        mailIndexRender(thread, req, res, next));
    }
    else {
      req.session.mailarchive_thread = false;
      mailarchiveAPI.unthreadedMails(req.params.groupname,
        mailarchiveAPI.sortOnTimeDescending,
        mailIndexRender(thread, req, res, next));
    }
  });

  app.get('/message', function (req, res, next) {
    var id = req.query.id;
    if (!id) { res.send(404); return; }
    mailarchiveAPI.mailForId(id,
      function (err, mail) {
        if (err) { next(err); return; }
        mailarchiveAPI.addMemberNick(mail, function (err) {
          if (err) { next(err); return; }
          res.render('message', {mail: mail});
        });
      });
  });

  return app;
};
