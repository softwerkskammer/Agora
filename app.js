"use strict";

var express = require('express'),
  http = require('http'),
  path = require('path'),
  winston = require('winston');

function ensureRequestedUrlEndsWithSlash(req, res, next) {
  function endsWithSlash(string) {
    return (/\/$/).test(string);
  }

  if (!endsWithSlash(req.url)) {
    return res.redirect(req.url + '/');
  }
  next();
}

function createLogger(loggerName, conf) {
  var confPrefix = 'logging:' + loggerName;

  winston.loggers.add(loggerName, {
    console: {
      colorize: true,
      level: conf.get(confPrefix + ':consoleLevel')
    }
  });

  var filename = conf.get(confPrefix + ':filename');

  if (typeof filename !== 'undefined') {
    var logger = winston.loggers.get(loggerName);
    logger.add(winston.transports.File, {
      timestamp: true,
      json: false,
      filename: filename,
      maxsize: conf.get(confPrefix + ':maxSize'),
      maxFiles: conf.get(confPrefix + ':maxFiles'),
      level: conf.get(confPrefix + ':fileLevel')
    });
  }
}

function initWinston(conf) {
  createLogger('application', conf);
  createLogger('http', conf);
}

function useApp(parent, url, conf, factory) {
  var child = factory(express(), conf);
  child.locals({ baseUrl: url });
  parent.get('/' + url, ensureRequestedUrlEndsWithSlash);
  parent.use('/' + url + '/', child);
  return child;
}

module.exports = function (conf) {
  var authentication = require('./lib/authentication')(conf),
    urlPrefix = conf.get('publicUrlPrefix');

  // initialize winston and two concrete loggers
  initWinston(conf);
  var appLogger = winston.loggers.get('application');
  var httpLogger = winston.loggers.get('http');

  // stream the log messages of express to winston, remove line breaks on  message
  var winstonStream = {
    write: function (message) {
      httpLogger.info(message.replace(/(\r\n|\n|\r)/gm, ""));
    }
  };

  function newUserMustFillInRegistration(req, res, next) {
    var urlNew = '/members/new';
    if (req.originalUrl !== urlNew && req.originalUrl !== '/members/submit' && req.user && !req.user.registered) {
      return res.redirect(urlPrefix + urlNew);
    }
    next();
  }

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
        app.use(express.logger({stream: winstonStream}));
        app.use(express.cookieParser());
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(express.session({secret: conf.get('secret')}));
        authentication.configure(app);
        app.use(newUserMustFillInRegistration);
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
        appLogger.info('Server running at port ' + port);
        if (done) {
          done();
        }
      });
    },

    stop: function (done) {
      this.server.close(function () {
        appLogger.info('Server stopped');
        if (done) {
          done();
        }
      });
    }
  };
};
