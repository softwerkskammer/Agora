"use strict";

module.exports = function (app) {

  app.get('/', function (req, res) {
    res.send('Upcoming events');
  });

  app.get('/:id', function (req, res) {
    res.send('Event ' + req.params.id);
  });

  return app;
};

