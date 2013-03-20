"use strict";

var eventsApp = require('express')();

eventsApp.get('/', function (req, res) {
  res.render('index', { title: 'Upcoming events' });
});

eventsApp.get('/:id', function (req, res) {
  res.render('index', { title: 'Event ' + req.params.id });
});

module.exports = eventsApp;
