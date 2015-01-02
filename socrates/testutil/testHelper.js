'use strict';

var _ = require('lodash');
var express = require('express');
var userStub = require('../../softwerkskammer/testutil/userStub');
var i18n = require('i18next');
var jade = require('jade');

module.exports = function (internalAppName, configuredBeans) {
  var appName = internalAppName;
  var beans = configuredBeans || require('./configureForTest').get('beans');

  i18n.init({
    supportedLngs: ['en'],
    preload: ['en'],
    fallbackLng: 'en',
    resGetPath: 'locales/__ns__-__lng__.json'
  });

  return {
    createApp: function (params) { /* memberId, member, middlewares */
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

      _.each(params.middlewares, function (middleware) {
        app.use(middleware);
      });

      if (params.memberId) {
        var Member = beans.get('member');
        app.use(userStub({member: new Member({id: params.memberId})}));
      }

      if (params.member) {
        app.use(userStub({member: params.member}));
      }

      app.use(beans.get('accessrights'));
      app.use(beans.get('expressViewHelper'));
      app.use('/', beans.get(appName));

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

