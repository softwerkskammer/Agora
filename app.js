"use strict";

var express = require('express');
var http = require('http');
var path = require('path');
var winston = require('winston');
var MongoStore = require('connect-mongo')(express);

function ensureRequestedUrlEndsWithSlash(req, res, next) {
  function endsWithSlash(string) {
    return (/\/$/).test(string);
  }

  if (!endsWithSlash(req.url)) {
    return res.redirect(req.url + '/');
  }
  next();
}

function useApp(parent, url, conf, factory) {
  var child = factory(express(), conf);
  child.locals({
    baseUrl: url,
    pretty: true
  });
  parent.get('/' + url, ensureRequestedUrlEndsWithSlash);
  parent.use('/' + url + '/', child);
  return child;
}

function addToLocals(req, res, next) {
  res.locals.calViewYear = req.session.calViewYear;
  res.locals.calViewMonth = req.session.calViewMonth;
  next();
}

module.exports = function (conf) {
  var authentication = require('./lib/authentication'),
    members = require('./lib/members')();

  // initialize winston and two concrete loggers
  require('winston-config').winstonConfigFromFile(__dirname + '/./config/winston-config.json');
  var appLogger = winston.loggers.get('application');
  var httpLogger = winston.loggers.get('http');

  // stream the log messages of express to winston, remove line breaks on  message
  var winstonStream = {
    write: function (message) {
      httpLogger.info(message.replace(/(\r\n|\n|\r)/gm, ""));
    }
  };

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
        app.use(express.favicon(path.join(__dirname, 'public/img/Softwerkskammer16x16.ico')));
        app.use(express.logger({stream: winstonStream}));
        app.use(express.cookieParser());
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(express.session({secret: conf.get('secret'), cookie: {maxAge: 86400 * 1000 * 7}}));
        app.use(addToLocals);
        authentication.configure(app);
        app.use(members.newUserMustFillInRegistration);
        app.use(app.router);
        app.use(express.static(path.join(__dirname, 'public')));
      });

      app.use('/', require('./lib/site'));
      useApp(app, 'administration', conf, require('./lib/administration'));
      useApp(app, 'activities', conf, require('./lib/activities'));
      useApp(app, 'members', conf, members.create);
      useApp(app, 'groups', conf, require('./lib/groups'));
      useApp(app, 'announcements', conf, require('./lib/announcements'));
      useApp(app, 'auth', conf, authentication.initialize);

      app.configure('development', function () {
        // Handle 404
        app.use(function (req, res) {
          res.render('errorPages/404.jade');
        });

        // Handle 500
        app.use(function (error, req, res, next) {
          appLogger.error(error.stack);
          if (/InternalOpenIDError|BadRequestError|InternalOAuthError/.test(error.name)) {
            return res.render('errorPages/authenticationError.jade', {error: error});
          }
          res.render('errorPages/500.jade', {error: error});
          next; // needed for jshint
        });
      });

      app.configure('production', function () {
        //app.use(express.errorHandler());
      });

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
