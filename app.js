"use strict";

var express = require('express');
var http = require('http');
var path = require('path');
var passport = require('passport');
var MongoStore = require('connect-mongo')(express);

function useApp(parent, url, factory) {
  function ensureRequestedUrlEndsWithSlash(req, res, next) {
    if (!(/\/$/).test(req.url)) { return res.redirect(req.url + '/'); }
    next();
  }

  var child = factory(express());
  child.locals({pretty: true});
  parent.get('/' + url, ensureRequestedUrlEndsWithSlash);
  parent.use('/' + url + '/', child);
  return child;
}

var conf = require('nconf');
var beans = conf.get('beans');

// initialize winston and two concrete loggers
var winston = require('winston-config').fromFileSync(path.join(__dirname, 'config/winston-config.json'));

var appLogger = winston.loggers.get('application');
var httpLogger = winston.loggers.get('http');

var sessionStore = new MongoStore({
  db: 'swk',
  host: conf.get('mongoHost'),
  port: parseInt(conf.get('mongoPort'), 10),
  username: conf.get('mongoUser'),
  password: conf.get('mongoPass')
});

// stream the log messages of express to winston, remove line breaks on message
var winstonStream = {
  write: function (message) {
    httpLogger.info(message.replace(/(\r\n|\n|\r)/gm, ""));
  }
};

module.exports = {
  create: function () {
    var app = express();
    app.configure(function () {
      app.set('view engine', 'jade');
      app.set('views', path.join(__dirname, 'views'));
      app.use(express.favicon(path.join(__dirname, 'public/img/Softwerkskammer16x16.ico')));
      app.use(express.logger({stream: winstonStream}));
      app.use(express.cookieParser());
      app.use(express.urlencoded());
      app.use(express.methodOverride());
      app.use(express.compress());
      app.use(express.static(path.join(__dirname, 'public')));

      var sevenDays = 86400 * 1000 * 7;
      if (conf.get('dontUsePersistentSessions')) {
        // TODO: Umbau als CoolBean mit SessionStore als InMemoryStore von Express statt if Konstrukt (leider)
        app.use(express.session({secret: conf.get('secret'), cookie: {maxAge: sevenDays}, store: null}));
      } else {
        app.use(express.session({secret: conf.get('secret'), cookie: {maxAge: sevenDays}, store: sessionStore}));
      }
      app.use(passport.initialize());
      app.use(passport.session());
      app.use(beans.get('accessrights'));
      app.use(beans.get('secureByLogin'));
      app.use(beans.get('secureAdminOnly'));
      app.use(beans.get('expressViewHelper'));
      app.use(beans.get('redirectRuleForNewUser'));
      app.use(beans.get('announcementsInSidebar'));
      app.use(beans.get('wikiSubdirs'));
      app.use(app.router);
    });

    app.use('/', beans.get('siteApp'));
    useApp(app, 'administration', beans.get('administrationApp'));
    useApp(app, 'activities', beans.get('activitiesApp'));
    useApp(app, 'members', beans.get('membersApp'));
    useApp(app, 'groups', beans.get('groupsApp'));
    useApp(app, 'announcements', beans.get('announcementsApp'));
    useApp(app, 'mailsender', beans.get('mailsenderApp'));
    useApp(app, 'auth', beans.get('authenticationApp'));
    useApp(app, 'mailarchive', beans.get('mailarchiveApp'));
    useApp(app, 'wiki', beans.get('wikiApp'));
    useApp(app, 'waitinglist', beans.get('waitinglistApp'));

    app.configure('production', function () {
      // Handle 404
      app.use(function (req, res) {
        appLogger.error('404 - requested url was ' + req.url);
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

    app.configure('development', function () {
      app.use(express.errorHandler());
    });
    return app;
  },

  start: function (done) {
    var port = conf.get('port');
    var app = this.create();

    this.server = http.createServer(app);
    this.server.listen(port, function () {
      appLogger.info('Server running at port ' + port + ' in ' + process.env.NODE_ENV + ' MODE');
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
