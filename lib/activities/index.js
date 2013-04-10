"use strict";

var path = require('path');

module.exports = function (app, conf) {
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
          console.log('error: ', err);
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

  app.get('/new', function (req, res, next) {
    res.render('edit', { activity: new Activity() });
  });

  app.post('/submit', function (req, res, next) {
    activitySubmitted(req, res, next);
  });

  app.post('/edit/submit', function (req, res, next) {
    activitySubmitted(req, res, next);
  });

  app.get('/:id', function (req, res, next) {
    // this is a dummy and should be replace asap
    api.allActivities(function (err, activities) {
      if (err) {
        return next(err);
      }
      res.render('index', { activities: activities });
    });
  });

  return app;
};