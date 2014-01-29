"use strict";

var express = require('express');
var userMock = require('./userMock');
var i18n = require('i18next');
var jade = require("jade");

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
    createApp: function (memberID) {
      var app = express();
      app.use(express.urlencoded());
      var Member = beans.get('member');

      if (memberID) {
        app.use(userMock({member: new Member({id: memberID})}));
      }
      app.use(beans.get('accessrights'));
      app.use(i18n.handle);
      app.use(beans.get('expressViewHelper'));
      app.use('/', beans.get(appName)(express()));

      i18n.registerAppHelper(app);
      i18n.addPostProcessor("jade", function (val, key, opts) {
        return jade.compile(val, opts)();
      });
      return app;
    }
  };
};

