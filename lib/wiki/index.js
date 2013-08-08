"use strict";
var path = require('path');
var Renderer = require('./renderer');

var Git = require("./gitmech");

var error404 = function (req, res) {
  res.locals.title = "404 - Not found";
  res.statusCode = 404;
  res.render('404.jade');
};

var pageShow = function (req, res, app) {

  var pageName = req.params.page;
  var pageVersion = req.params.version || "HEAD";

  Git.readFile(pageName + ".md", pageVersion, function (err, content) {

    if (err) {
      if (req.user) {
        res.redirect('/pages/new/' + pageName);
      } else {
        // Special case for "home", anonymous user and an empty docbase
        if (pageName === 'home') {
          res.render('welcome', {
            title: 'Welcome to ' + app.locals.appTitle
          });
        } else {
          error404(req, res);
          return;
        }
      }

    } else {

      Git.log(pageName + ".md", pageVersion, function (err, metadata) {

        res.locals.canEdit = true;
        if (pageVersion !== 'HEAD') {
          res.locals.warning = "You're not reading the latest revision of this page, which is " + "<a href='/wiki/" + pageName + "'>here</a>.";
          res.locals.canEdit = false;
        }

        res.locals.notice = req.session.notice;
        delete req.session.notice;

        res.render('show', {
          title: app.locals.appTitle + " – " + content.split("\n")[0].substr(1),
          content: Renderer.render(content),
          pageName: pageName,
          metadata: metadata
        });

      });
    }
  });
};

module.exports = function (app) {

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.get('/:page/:version', function (req, res) {
    Git.setup("/JavascriptDev/Agora-Wiki/", "");
    return pageShow(req, res, app);

/*
    var page = {
      title: 'Seitentitel',
      text: 'TEXT',
      author: 'author'
    };
    res.render('get', { page: page });
*/
  });

  return app;
};
