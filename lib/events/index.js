"use strict";

module.exports = function (app) {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');

  var fakes = [
    { title: 'Event #1' },
    { title: 'Event #2' }
  ];

  app.get('/', function (req, res) {
    res.render('index', { events: fakes });
  });

  app.get('/:id', function (req, res) {
    res.render('get', { event: fakes[0] });
  });

  return app;
};

