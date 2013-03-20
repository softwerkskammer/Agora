"use strict";

var express = require('express');
var path = require('path');
var app = express();

app.configure(function () {
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, '../public')));
});

app.configure('development', function () {
  app.use(express.errorHandler());
});

app.use('/', require('./site'));
app.use('/events', require('./events'));
app.use('/gruppenverwaltung', require('./gruppenverwaltung'));

var http = require('http');
var server = http.createServer(app);

exports.start = function (port, done) {
  server.listen(port, function () {
    console.log('Server running at port ' + port);
    if (done) {
      done();
    }
  });
};

exports.stop = function (done) {
  server.close(function () {
    console.log('server stopped');
    if (done) {
      done();
    }
  });
};
