"use strict";

var store = require('./store');

module.exports = function (app) {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');

  app.get('/', function (req, res) {
    var events = store.getEvents();
    res.render('index', { events: events });
  });

  app.get('/:id', function (req, res) {
    var event = store.getEvent(req.params.id);
    res.render('get', { event: event });
  });

  return app;
};

