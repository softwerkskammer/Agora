'use strict';

var express = require('express');
var userStub = require('./userStub');
var i18n = require('i18next');
var jade = require('jade');

module.exports = function (internalAppName, configuredBeans) {
  var appName = internalAppName;
  var beans = configuredBeans || require('./configureForTest').get('beans');

  i18n.init({
    supportedLngs: ['de'],
    preload: ['de'],
    fallbackLng: 'de',
    resGetPath: 'locales/__ns__-__lng__.json'
  });

  return {
    createApp: function (memberID) {  /* add middleware list as dynamic params */
      var i;
      var middleware;
      var app = express();
      app.locals.pretty = true;
      app.enable('view cache');
      app.use(require('cookie-parser')());
      app.use(require('body-parser').urlencoded());
      app.use(i18n.handle);
      app.use(require('express-session')({secret: 'secret', cookie: {maxAge: 10000}}));

      for (i = 1; i < arguments.length; i = i + 1) {
        middleware = arguments[i];
        if (middleware) {
          app.use(middleware);
        }
      }

      if (memberID) {
        var Member = beans.get('member');
        app.use(userStub({member: new Member({id: memberID})}));
      }
      app.use(beans.get('accessrights'));
      app.use(beans.get('expressViewHelper'));
      app.use('/', beans.get(appName));

      var appLogger = { error: function () { return undefined; } };
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

