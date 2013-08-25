"use strict";
var path = require('path');
var Renderer = require('./renderer');
var beans = require('nconf').get('beans');
var api = beans.get('wikiAPI');

function showPage(pageName, pageVersion, req, res, next) {
  api.pageShow(pageName, pageVersion, function (err, content, metadata) {
    if (err) {
      if (req.user) {
        return res.redirect('/wiki/new/' + encodeURIComponent(pageName));
      }
      return next(err);
    }
    res.render('get', {
      content: Renderer.render(content),
      pageName: pageName,
      metadata: metadata[0],
      canEdit: pageVersion === 'HEAD'
    });
  });
}
module.exports = function (app) {

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.get('/versions/:page', function (req, res, next) {
    var pageName = req.params.page;
    api.pageHistory(pageName, function (err, metadata) {
      if (err) { return next(err); }
      res.render('history', {
        pageName: pageName,
        items: metadata
      });
    });
  });

  app.get('/compare/:page/:revisions', function (req, res, next) {
    var pageName = req.params.page;
    var revisions = req.params.revisions;
    api.pageCompare(pageName, revisions, function (err, diff) {
      if (err) { return next(err); }
      res.render('compare', {
        pageName: pageName,
        lines: diff.asLines()
      });
    });
  });

  // editing pages

  app.get('/new/:page', function (req, res, next) {
    var pageName = req.params.page;
    api.pageNew(pageName, function (err) {
      if (err) {return res.redirect("/wiki/" + encodeURIComponent(pageName));}
      res.render('edit', {
        page: {content: ''},
        pageName: pageName
      });
    });
  });

  app.get('/edit/:page', function (req, res, next) {
    var pageName = req.params.page;
    api.pageEdit(pageName, req.user, function (err, content, lockWarning) {
      if (err) {
        if (req.user) {
          return res.redirect('/wiki/new/' + pageName);
        }
        return next(err);
      }
      res.render('edit', {
        page: {content: content},
        pageName: pageName
      });
    });
  });

  app.post('/:page', function (req, res, next) {
    var pageName = req.params.page;
    api.pageSave(pageName, req.body.content, req.body.comment, req.user, function (err) {
      if (err) { return next(err); }
      res.redirect("/wiki/" + encodeURIComponent(pageName));
    });
  });

  // showing pages

  app.get('/:page/:version', function (req, res, next) {
    showPage(req.params.page, req.params.version, req, res, next);
  });

  app.get('/:page', function (req, res, next) {
    showPage(req.params.page, 'HEAD', req, res, next);
  });

  app.get('/', function (req, res, next) {
    showPage('index', 'HEAD', req, res, next);
  });

  return app;
}
;
