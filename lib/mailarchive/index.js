"use strict";

var path = require('path');
var conf = require('nconf');
var mailarchiveAPI = conf.get('beans').get('mailarchiveAPI');

module.exports = function (app) {

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  function mailIndexRender(thread, req, res, next) {
    return function (err, mailHeaders) {
      if (err) {
        next(err);
        return;
      }
      mailarchiveAPI.addProfileDataForMembers(mailHeaders, function (err) {
        if (err) {
          next(err);
          return;
        }
        var view;
        if (mailHeaders.length === 0) {view = 'indexNoMails'; }
        else if (thread) {view = 'indexThreaded'; }
        else {view = 'indexUnthreaded'; }
        res.render(view, {group: req.params.groupname, mailHeaders: mailHeaders});
      });
    };
  }

  app.get('/list/:groupname', function (req, res, next) {
    var threadedRepresentationRequested = req.query.thread === 'true';
    var threadedRepresentationDisallowedByRequest = req.query.thread === 'false';
    var displayMailsThreaded = threadedRepresentationRequested || !threadedRepresentationDisallowedByRequest && req.session.displayMailsThreaded;
    if (displayMailsThreaded) {
      req.session.displayMailsThreaded = true;
      mailarchiveAPI.threadedMails(req.params.groupname,
        mailarchiveAPI.sortOnLastResponseTimeDescending,
        mailIndexRender(displayMailsThreaded, req, res, next));
    }
    else {
      req.session.displayMailsThreaded = false;
      mailarchiveAPI.unthreadedMails(req.params.groupname,
        mailarchiveAPI.sortOnTimeDescending,
        mailIndexRender(displayMailsThreaded, req, res, next));
    }
  });

  app.get('/message', function (req, res, next) {
    var id = req.query.id;
    if (!id) {
      res.send(404);
      return;
    }
    mailarchiveAPI.mailForId(id,
      function (err, mail) {
        if (err) {
          next(err);
          return;
        }
        mailarchiveAPI.addProfileDataForMember(mail, function (err) {
          if (err) {
            next(err);
            return;
          }
          res.render('message', {mail: mail});
        });
      });
  });

  return app;
};
