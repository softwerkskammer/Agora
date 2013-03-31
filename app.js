"use strict";

var express = require('express'),
  http = require('http'),
  path = require('path'),
  authentication = require('./lib/authentication');

function ensureRequestedUrlEndsWithSlash(req, res, next) {
  function endsWithSlash(string) { return (/\/$/).test(string); }
  if (!endsWithSlash(req.url)) {
    return res.redirect(req.url + '/');
  }
  next();
}

function useApp(parent, url, conf, factory) {
  var child = factory(express(), conf);
  child.locals({ baseUrl: url });
  parent.get('/' + url, ensureRequestedUrlEndsWithSlash);
  parent.use('/' + url + '/', child);
  return child;
}

module.exports = function (conf) {
  return {
    create: function () {
      var app = express();
      this.initApp(app, conf);
      return app;
    },

    initApp: function (app) {
      app.configure(function () {
        app.set('view engine', 'jade');
        app.set('views', path.join(__dirname, 'views'));
        app.use(express.favicon());
        app.use(express.logger('dev'));
        app.use(express.cookieParser());
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(express.session({secret: conf.get('secret')}));
        authentication.configure(app);
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
      useApp(app, 'auth', conf, authentication.initialize);
    },

    start: function (done) {
      var port = conf.get('port');
      var app = this.create();
      this.server = http.createServer(app);
      this.server.listen(port, function () {
        console.log('Server running at port ' + port);
        if (done) {
          done();
        }
      });
    },

    stop: function (done) {
      this.server.close(function () {
        console.log('Server stopped');
        if (done) {
          done();
        }
      });
    }
  };
};
