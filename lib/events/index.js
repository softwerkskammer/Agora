"use strict";

module.exports = function (app) {

  app.get('/', function (req, res) {
    res.render('index', { title: 'Upcoming events' });
  });

  app.get('/:id', function (req, res) {
    res.render('index', { title: 'Event ' + req.params.id });
  });

  return app;
};

