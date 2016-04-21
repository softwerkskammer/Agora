'use strict';
var winston = require('winston');

function shutup() {
  winston.loggers = {
    add: function () { return undefined; },
    get: function () {
      var dummyLogger = {
        warn: function () {return undefined; },
        info: function () { return undefined; },
        error: function () { return undefined; }
      };
      return dummyLogger;
    }
  };

}

module.exports = shutup;
