"use strict";

var path = require('path');
var winston = require('winston');

module.exports = function (app) {
  var logger = winston.loggers.get('application');

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  var api = require('./activitiesAPI');
  var groups = require('../groups/groupsAPI');
  var Activity = require('./activity');

  function activitySubmitted(req, res, next) {
    var activity = new Activity().fromObject(req.body);
    if (activity.isValid()) {
      api.saveActivity(activity, function (err) {
        if (err) {
          logger.error('Error in saving Activity', err);
          return next(err);
        }
        res.redirect('/activities/' + activity.id);
      });
    } else {
      res.redirect('/activities/');
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
    groups.getAllAvailableGroups(function (err, groups) {
      if (err) {
        logger.error('Error in fetching allAvailableGroups activity - redirecting to /');
        return res.redirect('/activities/');
      }
      res.render('edit', { activity: new Activity(), groups: groups });
    });
  });

  app.get('/edit/:id', function (req, res) {
    api.getActivityForId(req.params.id, function (err, activity) {
      if (err || activity === null) {
        logger.error('Error in fetching single activity - redirecting to /');
        return res.redirect('/activities/');
      }
      groups.getAllAvailableGroups(function (err, groups) {
        if (err) {
          logger.error('Error in fetching allAvailableGroups activity - redirecting to /');
          return res.redirect('/activities/');
        }
        res.render('edit', { activity: activity, groups: groups });
      });
    });
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
        logger.error('Error in fetching single activity - redirecting to /activities');
        return res.redirect('/activities/');
      }
      groups.getAllAvailableGroups(function (err, groups) {
        if (err) {
          return res.redirect('/activities/');
        }
        res.render('get', { activity: activity, groups: groups });
      });
    });
  });

  return app;
};
