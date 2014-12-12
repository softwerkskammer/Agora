'use strict';

var express = require('express');
var http = require('http');
var path = require('path');
var cookieParser = require('cookie-parser');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var bodyparser = require('body-parser');
var compress = require('compression');
var csurf = require('csurf');
var jade = require('jade');
var i18n = require('i18next');

var conf = require('nconf');
var beans = conf.get('beans');

// initialize winston and two concrete loggers
/*jslint stupid: true */
var winston = require('winston-config').fromFileSync(path.join(__dirname, '../config/winston-config.json'));
/*jslint stupid: false */

var appLogger = winston.loggers.get('socrates');
var httpLogger = winston.loggers.get('socrates-http');

// initialize i18n
i18n.init({
  ignoreRoutes: ['clientscripts/', 'fonts/', 'images/', 'img/', 'stylesheets/'],
  supportedLngs: ['en'],
  preload: ['en'],
  fallbackLng: 'en',
  resGetPath: 'locales/__ns__-__lng__.json'
});

// stream the log messages of express to winston, remove line breaks on message
var winstonStream = {
  write: function (message) {
    httpLogger.info(message.replace(/(\r\n|\n|\r)/gm, ''));
  }
};

module.exports = {
  create: function () {
    var app = express();
    if (process.env.NODE_ENV !== 'production') {
      app.locals.pretty = true;
    }
    app.set('view engine', 'jade');
    app.set('views', path.join(__dirname, 'views'));
    app.use(favicon(path.join(__dirname, 'public/img/favicon.ico')));
    app.use(morgan('combined', {stream: winstonStream}));
    app.use(cookieParser());
    app.use(bodyparser.urlencoded({extended: true}));
    app.use(compress());
    app.use(express.static(path.join(__dirname, 'public'), {maxAge: 600 * 1000})); // ten minutes
    app.use(beans.get('expressSessionConfigurator'));
    app.use(beans.get('passportInitializer'));
    app.use(i18n.handle);
    app.use(beans.get('serverpathRemover'));
    app.use(beans.get('accessrights'));
    app.use(beans.get('secureByLogin'));
    app.use(beans.get('expressViewHelper'));
    app.use(beans.get('redirectRuleForNewUser'));
    app.use(beans.get('detectBrowser'));
    app.use(beans.get('secureAgainstClickjacking'));
    app.use(beans.get('socratesWikiSubdirs'));
    app.use(csurf());
    app.use(beans.get('addCsrfTokenToLocals'));
    app.use('/', beans.get('socratesSiteApp'));
    app.use('/registration/', beans.get('socratesRegistrationApp'));
    app.use('/auth/', beans.get('authenticationApp'));
    app.use('/members/', beans.get('socratesMembersApp'));
    app.use('/wiki/', beans.get('socratesWikiApp'));
    app.use(beans.get('handle404')(appLogger));
    app.use(beans.get('handle500')(appLogger));

    i18n.registerAppHelper(app);
    i18n.addPostProcessor('jade', function (val, key, opts) {
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
      if (done) { done(); }
    });
  },

  stop: function (done) {
    this.server.close(function () {
      appLogger.info('Server stopped');
      if (done) { done(); }
    });
  }
};
