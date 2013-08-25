"use strict";
var path = require('path');
var Renderer = require('./renderer');
var beans = require('nconf').get('beans');
var api = beans.get('wikiAPI');

function showPage(subdir, pageName, pageVersion, req, res, next) {
  api.pageShow(subdir, pageName, pageVersion, function (err, content, metadata) {
    if (err) {
      if (req.user) {
        return res.redirect('/wiki/new/' + subdir + '/' + encodeURIComponent(pageName));
      }
      return next(err);
    }
    res.render('get', {
      content: Renderer.render(content, subdir),
      pageName: pageName,
      subdir: subdir,
      metadata: metadata[0],
      canEdit: pageVersion === 'HEAD'
    });
  });
}
module.exports = function (app) {

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.get('/versions/:subdir/:page', function (req, res, next) {
    var pageName = req.params.page;
    var subdir = req.params.subdir;
    api.pageHistory(subdir, pageName, function (err, metadata) {
      if (err) { return next(err); }
      res.render('history', {
        pageName: pageName,
        subdir: subdir,
        items: metadata
      });
    });
  });

  app.get('/compare/:subdir/:page/:revisions', function (req, res, next) {
    var pageName = req.params.page;
    var subdir = req.params.subdir;
    var revisions = req.params.revisions;
    api.pageCompare(subdir, pageName, revisions, function (err, diff) {
      if (err) { return next(err); }
      res.render('compare', {
        pageName: pageName,
        subdir: subdir,
        lines: diff.asLines()
      });
    });
  });

  // editing pages

  app.get('/new/:subdir/:page', function (req, res) {
    var pageName = req.params.page;
    var subdir = req.params.subdir;
    api.pageNew(subdir, pageName, function (err) {
      if (err) {return res.redirect("/wiki/" + subdir + '/' + encodeURIComponent(pageName)); }
      res.render('edit', {
        page: {content: ''},
        subdir: subdir,
        pageName: pageName
      });
    });
  });

  app.get('/edit/:subdir/:page', function (req, res, next) {
    var pageName = req.params.page;
    var subdir = req.params.subdir;
    api.pageEdit(subdir, pageName, req.user, function (err, content, lockWarning) {
      if (err) {
        if (req.user) {
          return res.redirect('/wiki/new/' + subdir + '/' + pageName);
        }
        return next(err);
      }
      if (lockWarning) {
        res.locals.warning = lockWarning;
      }
      res.render('edit', {
        page: {content: content},
        subdir: subdir,
        pageName: pageName
      });
    });
  });

  app.post('/:subdir/:page', function (req, res, next) {
    var pageName = req.params.page;
    var subdir = req.params.subdir;
    api.pageSave(subdir, pageName, req.body.content, req.body.comment, req.user, function (err) {
      if (err) { return next(err); }
      res.redirect("/wiki/" + subdir + '/' + encodeURIComponent(pageName));
    });
  });

  // showing pages

  app.get('/list/:subdir/', function (req, res, next) {
    var subdir = req.params.subdir;
    api.pageList(subdir, function (err, items) {
      if (err) { return next(err); }
      res.render('list', {items: items, subdir: subdir});
    });
  });

  app.get('/:subdir/:page/:version', function (req, res, next) {
    showPage(req.params.subdir, req.params.page, req.params.version, req, res, next);
  });

  app.get('/:subdir/:page', function (req, res, next) {
    showPage(req.params.subdir, req.params.page, 'HEAD', req, res, next);
  });

  app.get('/:subdir/', function (req, res, next) {
    showPage(req.params.subdir, 'index', 'HEAD', req, res, next);
  });

  app.get('/:subdir', function (req, res) {
    res.redirect('/wiki/' + req.params.subdir + '/');
  });

  app.get('/', function (req, res) {
    res.redirect("/wiki/global/");
  });

  return app;
}
;
