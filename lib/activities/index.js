"use strict";

var path = require('path');
var winston = require('winston');
var validation = require('../commons/validation');
var moment = require('moment');

module.exports = function (app) {
  var logger = winston.loggers.get('application');

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  var api = require('./activitiesAPI');
  var groups = require('../groups/groupsAPI');
  var Activity = require('./activity');

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
      res.redirect('/activities/' + activity.id);
    });
  }

  app.get('/', function (req, res, next) {
    api.allActivities(function (err, activities) {
      if (err) {
        return next(err);
      }
      groups.getAllAvailableGroups(function (err, groups) {
        if (err) {
          logger.error('Error in fetching allAvailableGroups activity - redirecting to /');
          return next(err);
        }
        res.render('index', { activities: activities, groups: groups });
      });
    });
  });

  app.get('/eventsForSidebar', function (req, res, next) {
    var from = moment.unix(req.query.start);
    var until = moment.unix(req.query.end);
    req.session.calViewYear = from.year();
    req.session.calViewMonth = from.month();
    api.activitiesBetween(from, until, function (err, events) {
      if (err) {
        return next(err);
      }
      res.end(JSON.stringify(events));
    });
  });

  app.get('/new', function (req, res, next) {
    groups.getAllAvailableGroups(function (err, groups) {
      if (err) {
        logger.error('Error in fetching allAvailableGroups activity - redirecting to /');
        return next(err);
      }
      res.render('edit', { activity: new Activity(), groups: groups });
    });
  });

  app.get('/edit/:id', function (req, res, next) {
    api.getActivityForId(req.params.id, function (err, activity) {
      if (err || activity === null) {
        logger.error('Error in fetching single activity - redirecting to /');
        return next(err);
      }
      groups.getAllAvailableGroups(function (err, groups) {
        if (err) {
          logger.error('Error in fetching allAvailableGroups activity - redirecting to /');
          return next(err);
        }
        res.render('edit', { activity: activity, groups: groups });
      });
    });
  });

  app.post('/submit', function (req, res, next) {
    activitySubmitted(req, res, next);
  });

  app.get('/:id', function (req, res, next) {
    api.getActivityForId(req.params.id, function (err, activity) {
      if (err || activity === null) {
        logger.error('Error in fetching single activity - redirecting to /activities');
        return next(err);
      }
      groups.getAllAvailableGroups(function (err, groups) {
        if (err) {
          logger.error('Error in fetching allAvailableGroups activity - redirecting to /');
          return next(err);
        }
        res.render('get', { activity: activity, groups: groups });
      });
    });
  });

  return app;
};
