"use strict";
var path = require('path');
var moment = require('moment-timezone');

var beans = require('nconf').get('beans');
var validation = beans.get('validation');
var statusmessage = beans.get('statusmessage');
var api = beans.get('announcementsAPI');
var Announcement = beans.get('announcement');

module.exports = function (app) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  function announcementSubmitted(req, res, next) {
    var announcement = new Announcement(req.body);
    var errors = validation.isValidAnnouncement(announcement);
    if (errors.length !== 0) {
      return res.render('../../../views/errorPages/validationError', {errors: errors});
    }
    api.saveAnnouncement(announcement, function (err) {
      if (err) { return next(err); }
      statusmessage.successMessage('Speichern erfolgreich', 'Deine Nachricht wurde gespeichert.').putInSession(req);
      res.redirect('/announcements/' + encodeURIComponent(announcement.url));
    });
  }

  app.get('/', function (req, res, next) {
    api.allAnnouncementsUntilToday(function (err, announcements) {
      if (err) { return next(err); }
      res.render('index', { announcements: announcements, moment: moment });
    });
  });

  app.get('/new', function (req, res) {
    var announcement = new Announcement();
    if (req.user) { announcement.author = req.user.member.id; }
    res.render('edit', { announcement: announcement });
  });

  app.get('/checkurl', function (req, res) {
    var url = req.query.url;
    var previousUrl = req.query.previousUrl;
    if (url === previousUrl) { return res.end('true'); }
    api.isValidUrl(url, function (err, result) {
      if (err) { return res.end('false'); }
      res.end(result.toString());
    });
  });

  app.get('/edit/:url', function (req, res, next) {
    api.getAnnouncement(req.params.url, function (err, announcement) {
      if (err || !announcement) { return next(err); }
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
      if (err || !announcement) { return next(err); }
      api.getAuthorName(announcement, function (err, name) {
        if (err) { return next(err); }
        announcement.authorname = name;
        res.render('get', { announcement: announcement });
      });
    });
  });

  return app;
};
