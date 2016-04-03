'use strict';

var _ = require('lodash');
var express = require('express');
var userStub = require('./userStub');

module.exports = function (defaultLanguage) {
  return function (internalAppName, configuredBeans) {
    var appName = internalAppName;
    var beans = configuredBeans || require('./configureForTest').get('beans');
    var initI18N = beans.get('initI18N');

    return {
      createApp: function (params) { /* id, member, middlewares, baseurl, secureByMiddlewares, sessionID */
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
        if (atts.sessionID) {
          app.use(function (req, res, next) {
            req.sessionID = atts.sessionID;
            next();
          });
        }

        app.use(beans.get('expressViewHelper'));
        app.use(initI18N);

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

