"use strict";
var path = require('path');
var winston = require('winston');
var moment = require('moment');
var conf = require('nconf');

var validation = conf.get('beans').get('validation');

module.exports = function (app) {
  var logger = winston.loggers.get('application');

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  var api = conf.get('beans').get('announcementsAPI');
  var Announcement = conf.get('beans').get('announcement');

  function announcementSubmitted(req, res, next) {
    var announcement = new Announcement(req.body);
    var errors = validation.isValidAnnouncement(announcement);
    if (errors.length !== 0) {
      return res.render('../../../views/errorPages/validationError', {errors: errors});
    }
    api.saveAnnouncement(announcement, function (err) {
      if (err) {
        logger.error('Error in saving Announcement', err);
        return next(err);
      }
      res.redirect('/announcements/' + encodeURIComponent(announcement.url));
    });
  }

  app.get('/', function (req, res, next) {
    api.allAnnouncements(function (err, announcements) {
      if (err) {
        return next(err);
      }
      res.render('index', { announcements: announcements, moment: moment });
    });
  });

  app.get('/new', function (req, res) {
    res.render('edit', { announcement: new Announcement() });
  });

  app.get('/checkurl', function (req, res) {
    var url = req.query.url;
    var previousUrl = req.query.previousUrl;
    if (url === previousUrl) {
      return res.end('true');
    }
    api.isValidUrl(url, function (err, result) {
      if (err) {
        return res.end('false');
      }
      res.end(result.toString());
    });
  });

  app.get('/edit/:url', function (req, res, next) {
    api.getAnnouncement(req.params.url, function (err, announcement) {
      if (err || announcement === null) {
        logger.error('Error in fetching single announcement /edit/:url');
        return next(err);
      }
      res.render('edit', { announcement: announcement });
    });
  });

  app.post('/submit', function (req, res, next) {
    var url = req.body.url;
    var previousUrl = req.body.previousUrl;
    if (url !== previousUrl) {
      return api.isValidUrl(url, function (err, check) {
        if (err || !check) {
          var errors = ['Diese URL ist leider nicht verfügbar.'];
          return res.render('../../../views/errorPages/validationError', {errors: errors});
        }
        announcementSubmitted(req, res, next);
      });
    }
    announcementSubmitted(req, res, next);
  });

  app.get('/:url', function (req, res, next) {
    api.getAnnouncement(req.params.url, function (err, announcement) {
      if (err || announcement === null) {
        logger.error('Error in fetching single announcement /:url');
        return next(err);
      }
      res.render('get', { announcement: announcement, moment: moment });
    });
  });

  return app;
};
