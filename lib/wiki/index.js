"use strict";
var path = require('path');
var Fs = require("fs");
var Renderer = require('./renderer');
var Git = require("./gitmech")("/JavascriptDev/Agora-Wiki", "");
var Locker = require("./locker");
var Diff = require("./gitDiff");

var pageShow = function (req, res, next) {

  var pageName = req.params.page || 'index';
  var pageNameWithoutColons = pageName.replace(/:/, '/');
  var pageVersion = req.params.version || "HEAD";

  Git.readFile(pageNameWithoutColons + ".md", pageVersion, function (err, content) {

    if (err) {
      if (req.user) {
        return res.redirect('/wiki/new/' + pageName);
      }
      return next(err);
    }

    Git.log(pageNameWithoutColons + ".md", pageVersion, function (err, metadata) {
      res.render('get', {
        content: Renderer.render(content),
        pageName: pageName,
        metadata: metadata,
        canEdit: pageVersion === 'HEAD'
      });

    });
  });
};

var pageEdit = function (req, res, next) {

  var pageName = req.params.page || 'index';
  var pageNameWithoutColons = pageName.replace(/:/, '/');
  var lock = Locker.getLock(pageName);

  if (lock) {
    if (lock.user !== req.user) {
      res.locals.warning = "Warning: this page is probably being edited by " + lock.user;
    }
  }

  Git.readFile(pageNameWithoutColons + ".md", "HEAD", function (err, content) {
    if (err) {
      if (req.user) {
        return res.redirect('/wiki/new/' + pageName);
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

var pageNew = function (req, res) {

  var pageName = req.params.page;
  var pageNameWithoutColons = pageName.replace(/:/, '/');

  if (Fs.existsSync(Git.absPath(pageNameWithoutColons + ".md"))) {
    res.redirect("/wiki/" + pageName);
    return;
  }

  res.render('edit', {
    page: {content: ''},
    title: 'New page',
    pageName: pageName
  });
};

var pageSave = function (req, res, next) {

  var pageName = req.params.page;
  var pageNameWithoutColons = pageName.replace(/:/, '/');

  var content = req.body.content;
  var pageFile = Git.absPath(pageNameWithoutColons + ".md");

  var message = req.body.comment || "Content updated (" + pageName + ")";

  Fs.writeFile(pageFile, content, function (err) {
    if (err) { return next(err); }
    Git.add(pageNameWithoutColons + ".md", message, req.user.member.asGitAuthor(), function (err) {
      Locker.unlock(pageName);
      if (err) { return next(err); }
      res.redirect("/wiki/" + encodeURIComponent(pageName));
    });
  });
};

var pageHistory = function (req, res, next) {
  var pageName = req.params.page;

  Git.readFile(pageName + ".md", "HEAD", function (err) {
    if (err) { return next(err); }

    Git.log(pageName + ".md", "HEAD", 30, function (err, metadata) {
      res.render('history', {
        pageName: pageName,
        items: metadata
      });
    });
  });
};

var pageCompare = function (req, res) {
  var pageName = req.params.page;
  var revisions = req.params.revisions;
  Git.diff(pageName + ".md", revisions, function (err, diff) {
    res.render('compare', {
      pageName: pageName,
      lines: new Diff(diff).asLines()
    });
  });
};

module.exports = function (app) {

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.get('/versions/:page', function (req, res, next) {
    pageHistory(req, res, next);
  });

  app.get('/compare/:page/:revisions', function (req, res, next) {
    pageCompare(req, res, next);
  });

  // editing pages

  app.get('/new/:page', function (req, res, next) {
    pageNew(req, res, next);
  });

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
