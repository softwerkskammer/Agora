'use strict';
const winston = require('winston');

function shutup() {
  winston.loggers = {
    add: () => undefined,
    get: () => {
      const dummyLogger = {
        warn: () => undefined,
        info: () => undefined,
        error: () => undefined
      };
      return dummyLogger;
    }
  };

}

module.exports = shutup;
