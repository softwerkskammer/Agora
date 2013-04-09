"use strict";

var path = require('path');

module.exports = function (app, conf) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  var api = require('./announcementAPI')(conf);

  app.get('/', function (req, res, next) {
    api.allAnnouncements(function (err, announcements) {
      if (err) {
        return next(err);
      }
      res.render('index', { announcements: announcements });
    });
  });

  return app;
};