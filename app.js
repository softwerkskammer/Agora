"use strict";

var express = require('express');
var path = require('path');
var app = express();

function useApp(parent, url, factory) {
  var child = factory(express());
  child.locals({ baseUrl: url });
  parent.use(url, child);
  return child;
}

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
useApp(app, '/events', require('./lib/events'));
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
