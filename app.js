"use strict";

var express = require('express');
var path = require('path');
var app = express();

var appTemplate = function () {
  return express();
};

app.configure(function () {
  app.set('view engine', 'jade');
  app.set('views', path.join(__dirname, 'views'));
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
  app.use(express.errorHandler());
});

app.use('/', require('./lib/site'));
app.use('/events', require('./lib/events')(appTemplate()));
app.use('/groups_administration', require('./lib/groups_administration'));
var groupsApp = require('./lib/groups');
/* This is needed in the groups.jade view, to produce reasonable hrefs */
groupsApp.locals({
  groups_route: 'groups'
});

app.use('/groups', groupsApp);

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
    console.log('Server stopped');
    if (done) {
      done();
    }
  });
};
