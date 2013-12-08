"use strict";

var express = require('express');
var conf = require('./configureForTest');
var userMock = require('./userMock');
var i18n = require('i18next');
var beans = conf.get('beans');

module.exports = function (internalAppName) {
  var appName = internalAppName;

  i18n.init({  });

  return {
    createApp: function (memberID) {
      var app = express();
      app.use(express.urlencoded());
      if (memberID) {
        app.use(userMock({member: {id: memberID}}));
      }
      app.use(beans.get('accessrights'));
      app.use(i18n);
      app.use('/', beans.get(appName)(express()));
      return app;
    }
  };
};

