'use strict';
var winston = require('winston');

function shutup() {
  var dummyLogger = null;
  winston.loggers = {
    add: function () { return undefined; },
    get: function () {
      if (dummyLogger === null) {
          dummyLogger = {
              warn: function () {return undefined;},
              info: function () {return undefined;},
              error: function () {return undefined;}
          };
      }
      return dummyLogger;
    }
  };

}

module.exports = shutup;
