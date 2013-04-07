"use strict";

var path = require('path');

module.exports = function (app, conf) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  var api = require('./activitiesAPI')(conf);

  app.get('/', function (req, res, next) {
    api.allActivities(function (err, activities) {
      if (err) {
        return next(err);
      }
      res.render('index', { activities: activities });
    });
  });

  app.get('/:id', function (req, res) {
    var activity = api.getActivity(req.params.id);
    res.render('get', { activity: activity });
  });

  return app;
};