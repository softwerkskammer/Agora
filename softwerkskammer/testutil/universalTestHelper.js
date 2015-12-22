'use strict';

var _ = require('lodash');
var express = require('express');
var userStub = require('./userStub');
var initI18N = require('../lib/middleware/initI18N');

module.exports = function (defaultLanguage, abspath) {
  return function (internalAppName, configuredBeans) {
    var appName = internalAppName;
    var beans = configuredBeans || require('./configureForTest').get('beans');

    return {
      createApp: function (params) { /* id, member, middlewares, baseurl, secureByMiddlewares */
        var atts = params || {};
        var app = express();
        app.locals.pretty = true;
        app.enable('view cache');
        app.use(require('cookie-parser')());
        app.use(require('body-parser').urlencoded({extended: true}));
        app.use(function (req, res, next) {
          res.locals.removeServerpaths = function (msg) { return msg; };
          next();
        });
        app.use(beans.get('expressSessionConfigurator'));

        if (atts.id) {
          var Member = beans.get('member');
          app.use(userStub({member: new Member({id: atts.id})}));
        }
        if (atts.member) {
          app.use(userStub({member: atts.member}));
        }
        if (atts.user) {
          app.use(userStub(atts.user));
        }
        app.use(beans.get('accessrights'));
        _.each(atts.secureByMiddlewares, function (middleware) {
          app.use(middleware);
        });
        app.use(function (req, res, next) {
          req.session.language = defaultLanguage;
          next();
        });

        app.use(beans.get('expressViewHelper'));
        app.use(initI18N('fr', abspath).middleware); // fr because of some technical reasons I do not yet understand... (leider)

        _.each(atts.middlewares, function (middleware) {
          app.use(middleware);
        });

        var baseurl = atts.baseurl || '/';
        app.use(baseurl, beans.get(appName));

        var appLogger = {error: function () { return undefined; }};
        app.use(beans.get('handle404')(appLogger));
        app.use(beans.get('handle500')(appLogger));
        return app;
      }
    };
  };
};

