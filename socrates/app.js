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

var conf = require('simple-configure');
var beans = conf.get('beans');

// initialize winston and two concrete loggers
/*eslint no-sync: 0 */
var winston = require('winston-config').fromFileSync(path.join(__dirname, '../config/winston-config.json'));

var appLogger = winston.loggers.get('socrates');
var httpLogger = winston.loggers.get('socrates-http');

// stream the log messages of express to winston, remove line breaks on message
var winstonStream = {
  write: function (message) {
    httpLogger.info(message.replace(/(\r\n|\n|\r)/gm, ''));
  }
};

function useApp(parent, url, child) {
  if (child.get('env') !== 'production') {
    child.locals.pretty = true;
  }
  parent.use(url, child);
  return child;
}



module.exports = {
  create: function () {
    var app = express();
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
    app.use(beans.get('passportSessionInitializer'));
    app.use(beans.get('serverpathRemover'));
    app.use(beans.get('accessrights'));
    app.use(beans.get('secureByLogin'));
    app.use(beans.get('secureSuperuserOnly'));
    app.use(beans.get('secureSoCraTesAdminOnly'));
    app.use(beans.get('expressViewHelper'));
    app.use(beans.get('initI18N'));
    app.use(beans.get('redirectRuleForNewUser'));
    app.use(beans.get('detectBrowser'));
    app.use(beans.get('secureAgainstClickjacking'));
    app.use(beans.get('socratesWikiSubdirs'));
    app.use(csurf());
    app.use(beans.get('addCsrfTokenToLocals'));
    app.use('/', beans.get('socratesSiteApp'));
    app.use('/activities/', beans.get('socratesActivitiesApp'));
    useApp(app, '/registration/', beans.get('socratesRegistrationApp'));
    useApp(app, '/activityresults/', beans.get('socratesActivityresultsApp'));
    useApp(app, '/auth/', beans.get('authenticationApp'));
    useApp(app, '/mailsender/', beans.get('socratesMailsenderApp'));
    useApp(app, '/members/', beans.get('socratesMembersApp'));
    useApp(app, '/gallery/', beans.get('galleryApp'));
    useApp(app, '/subscribers/', beans.get('socratesSubscribersApp'));
    useApp(app, '/wiki/', beans.get('socratesWikiApp'));
    app.use(beans.get('handle404')());
    app.use(beans.get('handle500')(appLogger));

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
