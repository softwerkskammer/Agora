"use strict";
var path = require('path');
var Fs = require("fs");
var Renderer = require('./renderer');
var Git = require("./gitmech");
var Locker = require("./locker");

var pageShow = function (req, res, next) {

  var pageName = (req.params.page || 'index').replace(/:/, '/');
  var pageVersion = req.params.version || "HEAD";
  Git.setup("/JavascriptDev/Agora-Wiki/", "");

  Git.readFile(pageName + ".md", pageVersion, function (err, content) {

    if (err) {
      if (req.user) {
        return res.redirect('/wiki/new/' + pageName);
      }
      return next(err);
    }

    Git.log(pageName + ".md", pageVersion, function (err, metadata) {
      res.locals.canEdit = true;
      if (pageVersion !== 'HEAD') {
        res.locals.warning = "You're not reading the latest revision of this page, which is " + "<a href='/wiki/" + pageName + "'>here</a>.";
        res.locals.canEdit = false;
      }

      res.locals.notice = req.session.notice;
      delete req.session.notice;

      res.render('show', {
        title: 'Wiki',
        content: Renderer.render(content),
        pageName: pageName,
        metadata: metadata
      });

    });
  });
};

var pageEdit = function (req, res, next) {
  Git.setup("/JavascriptDev/Agora-Wiki/", "");

  var pageName = req.params.page || 'index';
  var pageNameWithColons = pageName.replace(/:/, '/');
  var lock = Locker.getLock(pageName);

  if (lock) {
    if (lock.user !== req.user) {
      res.locals.warning = "Warning: this page is probably being edited by " + lock.user;
    }
  }

  Git.readFile(pageNameWithColons + ".md", "HEAD", function (err, content) {
    if (err) {
      if (req.user) {
        return res.redirect('/wiki/new/' + pageNameWithColons);
      }
      return next(err);
    }
    Locker.lock(pageName, req.user);
    res.render('edit', {
      page: {content: content},
      title: 'Edit page',
      pageName: pageName
    });
  });
};

var pageSave = function (req, res, next) {
  Git.setup("/JavascriptDev/Agora-Wiki/", "");

  var pageName = req.params.page;

  var content = req.body.content;
  var pageFile = Git.absPath(pageName + ".md");

  var message = req.body.comment || "Content updated (" + pageName + ")";

  Fs.writeFile(pageFile, content, function () {
    var member = req.user.member;
    Git.add(pageName + ".md", message, member.nickname + ' <' + member.email + '>', function (err) {
      if (err) {return next(err); }
      Locker.unlock(pageName);
      res.redirect("/wiki/" + pageName);
    });
  });
};

module.exports = function (app) {

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  // editing pages

  app.get('/edit/:page', function (req, res, next) {
    pageEdit(req, res, next);
  });

  app.post('/:page', function (req, res, next) {
    pageSave(req, res, next);
  });

  // showing pages

  app.get('/:page/:version', function (req, res, next) {
    pageShow(req, res, next);
  });

  app.get('/:page', function (req, res, next) {
    pageShow(req, res, next);
  });

  app.get('/', function (req, res, next) {
    pageShow(req, res, next);
  });

  return app;
};
