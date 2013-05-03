"use strict";

var path = require('path');
var winston = require('winston');
var moment = require('moment');
var async = require('async');
var conf = require('nconf');

var validation = conf.get('beans').get('validation');

module.exports = function (app) {
  var logger = winston.loggers.get('application');

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  var api = conf.get('beans').get('activitiesAPI');
  var groups = conf.get('beans').get('groupsAPI');
  var colors = conf.get('beans').get('colorAPI');
  var Activity = conf.get('beans').get('activity');

  function activitySubmitted(req, res, next) {
    var activity = new Activity(req.body);
    var errors = validation.isValidActivity(activity);
    if (errors.length !== 0) {
      return res.render('../../../views/errorPages/validationError', {errors: errors});
    }
    api.saveActivity(activity, function (err) {
      if (err) {
        logger.error('Error in saving Activity', err);
        return next(err);
      }
      res.redirect('/activities/' + encodeURIComponent(activity.url));
    });
  }

  app.get('/', function (req, res, next) {
    api.allActivities(function (err, activities) {
      if (err) {
        return next(err);
      }
      groups.getAllAvailableGroups(function (err, groups) {
        if (err) {
          logger.error('Error in fetching allAvailableGroups activity');
          return next(err);
        }
        res.render('index', { activities: activities, groups: groups, range: 'Alle' });
      });
    });
  });

  app.get('/upcoming', function (req, res, next) {
    api.upcomingActivities(function (err, activities) {
      if (err) {
        return next(err);
      }
      groups.getAllAvailableGroups(function (err, groups) {
        if (err) {
          logger.error('Error in fetching allAvailableGroups activity');
          return next(err);
        }
        res.render('index', { activities: activities, groups: groups, range: 'Kommende' });
      });
    });
  });

  app.get('/eventsForSidebar', function (req, res, next) {
    var from = moment.unix(req.query.start);
    if (from.date() > 1) {
      from.add('M', 1);
    }
    req.session.calViewYear = from.year();
    req.session.calViewMonth = from.month();

    var start = moment.unix(req.query.start);
    var end = moment.unix(req.query.end);

    async.parallel({
        groupColors: function (callback) {
          groups.allColors(callback);
        },
        colors: function (callback) {
          colors.allColors(callback);
        }
      },
      function (err, collectedColors) {
        if (err) { next(err); }
        api.eventsBetween(start, end, collectedColors.groupColors, collectedColors.colors, function (err, events) {
          if (err) {
            return next(err);
          }
          res.end(JSON.stringify(events));
        });
      });

  });

  app.get('/new', function (req, res, next) {
    groups.getAllAvailableGroups(function (err, groups) {
      if (err) {
        logger.error('Error in fetching allAvailableGroups activity');
        return next(err);
      }
      colors.allColors(function (err, colors) {
        if (err) { next(err); }
        async.map(colors, function (item, callback) { callback(null, item.id);  }, function (err, colorlist) {
          colorlist.unshift('aus Gruppe');
          res.render('edit', { activity: new Activity(), groups: groups, colorlist: colorlist });
        });
      });
    });
  });

  app.get('/edit/:url', function (req, res, next) {
    api.getActivity(req.params.url, function (err, activity) {
      if (err || activity === null) {
        logger.error('Error in fetching single activity');
        return next(err);
      }
      groups.getAllAvailableGroups(function (err, groups) {
        if (err) {
          logger.error('Error in fetching allAvailableGroups activity');
          return next(err);
        }
        colors.allColors(function (err, colors) {
          if (err) { next(err); }
          async.map(colors, function (item, callback) { callback(null, item.id);  }, function (err, colorlist) {
            colorlist.push('aus Gruppe');
            res.render('edit', { activity: activity, groups: groups, colorlist: colorlist });
          });
        });
      });
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
        activitySubmitted(req, res, next);
      });
    }
    activitySubmitted(req, res, next);
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

  app.get('/:url', function (req, res, next) {
    api.getActivity(req.params.url, function (err, activity) {
      if (err || activity === null) {
        logger.error('Error in fetching single activity');
        return next(err);
      }
      groups.getAllAvailableGroups(function (err, groups) {
        if (err) {
          logger.error('Error in fetching allAvailableGroups activity');
          return next(err);
        }
        res.render('get', { activity: activity, groups: groups, calViewYear: activity.year(), calViewMonth: activity.month() });
      });
    });
  });

  return app;
}
;
