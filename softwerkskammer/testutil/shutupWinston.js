'use strict';
var winston = require('winston');

function shutup() {
  var warnings = [];

  winston.loggers = {
    add: function () { return undefined; },
    get: function () {
      var dummyLogger = {
        warn: function (message) {
          warnings.push(message);
          return undefined; },
        info: function () { return undefined; },
        error: function () { return undefined; },
        getWarnings: function() {return warnings;},
        clearWarnings: function() {warnings = [];}
      };
      return dummyLogger;
    }
  };

}

module.exports = shutup;
