"use strict";

var express = require('express');
var path = require('path');
var app = express();

function useApp(parent, url, conf, factory) {
  console.log('confb: ', conf.get('port'));
  var child = factory(express(), conf);
  console.log('confa: ', conf.get('port'));
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
  console.log('1: ', conf.get('port'));
  useApp(app, 'events', conf, require('./lib/events'));
  console.log('2: ', conf.get('port'));  
  useApp(app, 'members', conf, require('./lib/members'));
  console.log('3: ', conf.get('port'));
  useApp(app, 'groups', conf, require('./lib/groups'));
  console.log('4: ', conf.get('port'));

  var http = require('http');
  var server = http.createServer(app);

  // start the server using the defined port
  var start = function (done) {
    var port = this.conf.get('port');
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

  console.log('localApp: ', localApp.conf.get('port'));

  return localApp;
};