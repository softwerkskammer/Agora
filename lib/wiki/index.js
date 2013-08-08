"use strict";
var path = require('path');

var Git = require("./gitmech");


module.exports = function (app) {

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.get('/:page/:version', function (req, res) {
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
          res.render('show', {
            title: app.locals.appTitle + " – " + content.split("\n")[0].substr(1),
            content: content,
            //content: Renderer.render(content),
            pageName: pageName,
            metadata: metadata
          });

        });
      }
    });

    var page = {
      title: 'Seitentitel',
      text: 'TEXT',
      author: 'author'
    };
    res.render('get', { page: page });
  });

  return app;
};
