"use strict";

var path = require('path');
var winston = require('winston');
var validation = require('../commons/validation');
var moment = require('moment');

module.exports = function (app) {
  var logger = winston.loggers.get('application');

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

//  var groups = require('../groups/groupsAPI');
  var api = require('./announcementAPI');
  var Announcement = require('./announcement');

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
      res.redirect('/announcements/' + announcement.url); // TODO: id muss für URLs gesäubert werden
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

  app.get('/edit/:url', function (req, res, next) {
    api.getAnnouncement(req.params.url, function (err, announcement) {
      if (err || announcement === null) {
        logger.error('Error in fetching single announcement');
        return next(err);
      }
      res.render('edit', { announcement: announcement });
    });
  });

  app.post('/submit', function (req, res, next) {
    var url = req.body.url;
    console.log('url = ' + url);
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
        logger.error('Error in fetching single announcement');
        return next(err);
      }
      res.render('get', { announcement: announcement, moment: moment });
    });
  });

  return app;
};
