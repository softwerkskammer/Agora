/*jslint stupid: true */
'use strict';

var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var compress = require('compression');
var i18n = require('i18next');
var jade = require('jade');

function useApp(parent, url, child) {
  function ensureRequestedUrlEndsWithSlash(req, res, next) {
    if (!(/\/$/).test(req.url)) { return res.redirect(req.url + '/'); }
    next();
  }

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
var winston = require('winston-config').fromFileSync(path.join(__dirname, '../config/winston-config.json'));

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
    httpLogger.info(message.replace(/(\r\n|\n|\r)/gm, ''));
  }
};

module.exports = {
  create: function () {
    var app = express();
    app.set('view engine', 'jade');
    app.set('views', path.join(__dirname, 'views'));
    app.use(favicon(path.join(__dirname, 'static/favicon.ico')));
    app.use(morgan('combined', {stream: winstonStream}));
    app.use(compress());
    app.use(express.static(path.join(__dirname, 'static'), { maxAge: 600 * 1000 })); // ten minutes

    app.use(beans.get('detectBrowser'));

    app.use('/', beans.get('socratesSiteApp'));

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
