"use strict";

var express = require('express');
var conf = require('./configureForTest');
var userMock = require('./userMock');

var beans = conf.get('beans');

module.exports = function (internalAppName) {
  var appName = internalAppName;

  return {
    createApp: function (memberID) {
      var app = express();
      app.use(express.urlencoded());
      if (memberID) {
        app.use(userMock({member: {id: memberID}}));
      }
      app.use(beans.get('accessrights'));
      app.use('/', beans.get(appName)(express()));
      return app;
    }
  };
};

