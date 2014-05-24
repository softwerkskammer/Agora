/*jslint stupid: true */
"use strict";

var express = require('express');
var http = require('http');
var path = require('path');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var favicon = require('static-favicon');
var morgan = require('morgan');
var bodyparser = require('body-parser');
var compress = require('compression');
var csurf = require('csurf');
var serveStatic = require('serve-static');
var i18n = require('i18next');
var jade = require("jade");

function useApp(parent, url, factory) {
  function ensureRequestedUrlEndsWithSlash(req, res, next) {
    if (!(/\/$/).test(req.url)) { return res.redirect(req.url + '/'); }
    next();
  }

  var child = factory(express());
  if (process.env.NODE_ENV !== 'production') {
    child.locals.pretty = true;
  }
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

// initialize i18n
i18n.init({
  ignoreRoutes: ['clientscripts/', 'fonts/', 'images/', 'img/', 'stylesheets/'],
  supportedLngs: ['de', 'en'],
  preload: ['de', 'en'],
  fallbackLng: 'de',
  resGetPath: 'locales/__ns__-__lng__.json'
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
    app.set('view engine', 'jade');
    app.set('views', path.join(__dirname, 'views'));
    app.use(favicon(path.join(__dirname, 'public/img/Softwerkskammer16x16.ico')));
    app.use(morgan({stream: winstonStream}));
    app.use(cookieParser());
    app.use(bodyparser.urlencoded());
    app.use(compress());
    app.use(serveStatic(path.join(__dirname, 'public')));

    app.use(beans.get('expressSessionConfigurator'));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(i18n.handle);
    app.use(beans.get('serverpathRemover'));
    app.use(beans.get('accessrights'));
    app.use(beans.get('secureByLogin'));
    app.use(beans.get('secureSuperuserOnly'));
    app.use(beans.get('expressViewHelper'));
    app.use(beans.get('redirectRuleForNewUser'));
    app.use(beans.get('announcementsInSidebar'));
    app.use(beans.get('wikiSubdirs'));
    app.use(beans.get('detectBrowser'));
    app.use(beans.get('secureAgainstClickjacking'));
    app.use(csurf());
    app.use(beans.get('addCsrfTokenToLocals'));

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
    useApp(app, 'dashboard', beans.get('dashboardApp'));

    app.use(beans.get('handle404')(appLogger));
    app.use(beans.get('handle500')(appLogger));

    i18n.registerAppHelper(app);
    i18n.addPostProcessor("jade", function (val, key, opts) {
      return jade.compile(val, opts)();
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
      appLogger.info('Server stopped');
      if (done) {
        done();
      }
    });
  }
};
