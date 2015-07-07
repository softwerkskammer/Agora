'use strict';

var _ = require('lodash');
var express = require('express');
var userStub = require('./userStub');
var i18n = require('i18next');
var jade = require('jade');
var path = require('path');

module.exports = function (defaultLanguage, abspath) {
  return function (internalAppName, configuredBeans) {
    var appName = internalAppName;
    var beans = configuredBeans || require('./configureForTest').get('beans');

    i18n.init({
      supportedLngs: [defaultLanguage],
      preload: [defaultLanguage],
      fallbackLng: defaultLanguage,
      resGetPath: path.join(abspath || '', 'locales/__ns__-__lng__.json')
    });

    return {
      createApp: function (params) { /* id, member, middlewares, baseurl */
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
        app.use(i18n.handle);
        app.use(beans.get('expressSessionConfigurator'));

        _.each(atts.middlewares, function (middleware) {
          app.use(middleware);
        });
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
        app.use(beans.get('expressViewHelper'));
        var baseurl = atts.baseurl || '/';
        app.use(baseurl, beans.get(appName));

        var appLogger = {error: function () { return undefined; }};
        app.use(beans.get('handle404')(appLogger));
        app.use(beans.get('handle500')(appLogger));

        i18n.registerAppHelper(app);
        i18n.addPostProcessor('jade', function (val, key, opts) {
          return jade.compile(val, opts)();
        });
        return app;
      }
    };
  };
};

