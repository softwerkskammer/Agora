"use strict";

var express = require('express'),
    http = require('http'),
    path = require('path');

var server;

function useApp(parent, url, conf, factory) {
  var child = factory(express(), conf);
  child.locals({ baseUrl: url });
  parent.use('/' + url, child);
  return child;
}

module.exports = function (conf) {
  var localApp = {};
  localApp.conf = conf;

  function initApp(app) {
    app.use('/', require('./lib/site'));
    useApp(app, 'events', conf, require('./lib/events'));
    useApp(app, 'members', conf, require('./lib/members'));
    useApp(app, 'groups', conf, require('./lib/groups'));

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
  }

  var start = function (done) {
    var port = localApp.conf.get('port');
    var app = express();
    initApp(app, conf);
    server = http.createServer(app);
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

  localApp.initApp = initApp;
  localApp.start = start;
  localApp.stop = stop;

  return localApp;
};