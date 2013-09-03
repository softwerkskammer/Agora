"use strict";
var path = require('path');
var Renderer = require('./renderer');
var beans = require('nconf').get('beans');
var api = beans.get('wikiAPI');

function showPage(subdir, pageName, pageVersion, req, res, next) {
  var completePageName = subdir + '/' + pageName;
  api.pageShow(completePageName, pageVersion, function (err, content, metadata) {
    if (err) {
      if (req.user) {
        return res.redirect('/wiki/edit/' + completePageName);
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
    var completePageName = subdir + '/' + pageName;
    api.pageHistory(completePageName, function (err, metadata) {
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
    var completePageName = subdir + '/' + pageName;
    var revisions = req.params.revisions;
    api.pageCompare(completePageName, revisions, function (err, diff) {
      if (err) { return next(err); }
      res.render('compare', {
        pageName: pageName,
        subdir: subdir,
        lines: diff.asLines()
      });
    });
  });

  // editing pages

  app.get('/edit/:subdir/:page', function (req, res, next) {
    var pageName = req.params.page;
    var subdir = req.params.subdir;
    var completePageName = subdir + '/' + pageName;
    api.pageEdit(completePageName, function (err, content, metadata) {
      if (err) { return next(err); }
      res.render('edit', {
        page: {content: content, comment: 'no commit message', metadata: metadata[0].fullhash},
        subdir: subdir,
        pageName: pageName
      });
    });
  });

  app.post('/:subdir/:page', function (req, res, next) {
    var pageName = req.params.page;
    var subdir = req.params.subdir;
    api.pageSave(subdir, pageName, req.body, req.user, function (err, message) {
      if (err) { return next(err); }
      if (message) {
        message.putInSession(req);
      }
      res.redirect('/wiki/' + subdir + '/' + pageName);
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
    res.redirect('/wiki/global/');
  });

  return app;
}
;
