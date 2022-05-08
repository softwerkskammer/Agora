"use strict";
const winston = require("winston");

function shutup() {
  winston.loggers = {
    add: () => undefined,
    get: () => {
      return {
        warn: () => undefined,
        info: () => undefined,
        error: () => undefined,
      };
    },
  };
}

module.exports = shutup;
