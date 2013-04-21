"use strict";

var path = require('path');
module.exports = function (app) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  var api = require('./announcementAPI');

  app.get('/', function (req, res, next) {
    api.allAnnouncements(function (err, announcements) {
      if (err) {
        return next(err);
      }
      res.render('index', { announcements: announcements });
    });
  });

  app.get('/:title', function (req, res, next) {
    api.getAnnouncement(req.params.title, function (err, announcement) {
      if (err) {
        return next(err);
      }
      res.render('get', { announcement: announcement });
    });
  });

  return app;
};
