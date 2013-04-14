"use strict";

var path = require('path'),
  winston = require('winston');

module.exports = function (app, conf) {
  var logger = winston.loggers.get('application');

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  var api = require('./activitiesAPI')(conf);
  var Activity = require('./activity');
  var urlPrefix = conf.get('publicUrlPrefix');

  function activitySubmitted(req, res, next) {
    var activity = new Activity().fromObject(req.body);
    if (activity.isValid()) {
      api.saveActivity(activity, function (err) {
        if (err) {
          logger.error('Error in saving Activity', err);
          return next(err);
        }
        res.redirect(urlPrefix + '/activities/' + activity.id);
      });
    } else {
      res.redirect(urlPrefix + '/activities/');
    }
  }

  app.get('/', function (req, res, next) {
    api.allActivities(function (err, activities) {
      if (err) {
        return next(err);
      }
      res.render('index', { activities: activities });
    });
  });

  app.get('/new', function (req, res) {
    res.render('edit', { activity: new Activity() });
  });

  app.post('/submit', function (req, res, next) {
    activitySubmitted(req, res, next);
  });

  app.post('/edit/submit', function (req, res, next) {
    activitySubmitted(req, res, next);
  });

  app.get('/:id', function (req, res) {
    api.getActivityForId(req.params.id, function (err, activity) {
      if (err || activity === null) {
        logger.error('Error in fetching single activity - redirecting to /');
//        req.flash('error', 'Please fill in all required fields (or whatever you want to say)');
        return res.redirect(urlPrefix + '/activities/');
      }
      res.render('get', { activity: activity });
    });
  });

  return app;
};