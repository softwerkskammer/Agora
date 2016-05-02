'use strict';
var winston = require('winston');

function shutup() {
  var dummyLogger = {
    warn: function () {return undefined;},
    info: function () {return undefined;},
    error: function () {return undefined;}
  };
  winston.loggers = {
    add: function () { return undefined; },
    get: function () { return dummyLogger;}
  };

}

module.exports = shutup;
