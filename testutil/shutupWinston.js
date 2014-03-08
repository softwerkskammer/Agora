"use strict";
var winston = require('winston');

function shutup() {
  winston.loggers = {
    add: function () {},
    get: function () {
      var dummyLogger = {
        warn: function () {},
        info: function () {},
        error: function () {}
      };
      return dummyLogger;
    }
  };
}

module.exports = shutup;
