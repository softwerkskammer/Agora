"use strict";

var eventsApp = require('express')();

eventsApp.get('/', function (req, res) {
  res.send('Upcoming events');
});

eventsApp.get('/:id', function (req, res) {
  res.send('Event ' + req.params.id);
});

module.exports = eventsApp;
