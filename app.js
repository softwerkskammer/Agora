"use strict";

var express = require('express');
var path = require('path');
var app = express();

function useApp(parent, url, conf, factory) {
  var child = factory(express(), conf);
  child.locals({ baseUrl: url });
  parent.use('/' + url, child);
  return child;
}

module.exports = function (conf) {
  var localApp = {};
  localApp.conf = conf;

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
  useApp(app, 'events', conf, require('./lib/events'));
  useApp(app, 'members', conf, require('./lib/members'));
  useApp(app, 'groups', conf, require('./lib/groups'));

  var http = require('http');
  var server = http.createServer(app);


  var start = function (done) {
    var port = localApp.conf.get('port');
    server.listen(port, function () {
      console.log('Server running at port ' + port);
      if (done) {
        done();
      }
    });
  };

  var stop = function (done) {
    server.close(function () {
      console.log('Server stopped');
      if (done) {
        done();
      }
    });
  };

  localApp.start = start;
  localApp.stop = stop;

  return localApp;
};

