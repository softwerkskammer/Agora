const util = require('util');
const winstonLogger = require('winston').loggers.get('nodemailer');

/**
 * Copied over from https://github.com/nodemailer/nodemailer/blob/master/lib/shared/index.js#L339
 * to adapt the custome logger from nodemailer to winston
 */
// https://github.com/winstonjs/winston/tree/2.x#logging-levels
const nodeMailerLogLevelToWinstonNpmLevels = {
  'fatal': 'error',
  'error': 'error',
  'warn': 'warn',
  'info': 'info',
  //'': 'verbose', //no match for verbose
  'debug': 'debug',
  'trace': 'silly'
};

function logFunc(logger, level, data, message, ...args) {
  let entry = {};
  Object.keys(data || {}).forEach(key => {
    if (key !== 'level') {
      entry[key] = data[key];
    }
  });

  logger[level](entry, message, ...args);
}

/**
 * Generates a bunyan-like logger that prints to console
 *
 * @returns {Object} Bunyan logger instance
 */
function createDefaultLogger(levels) {
  let levelMaxLen = 0;
  let levelNames = new Map();
  levels.forEach((level) => {
    if (level.length > levelMaxLen) {
      levelMaxLen = level.length;
    }
  });

  levels.forEach(level => {
    let levelName = level.toUpperCase();
    if (levelName.length < levelMaxLen) {
      levelName += ' '.repeat(levelMaxLen - levelName.length);
    }
    levelNames.set(level, levelName);
  });

  let print = (level, entry, message, ...args) => {
    let prefix = '';
    if (entry) {
      if (entry.tnx === 'server') {
        prefix = 'S: ';
      } else if (entry.tnx === 'client') {
        prefix = 'C: ';
      }

      if (entry.sid) {
        prefix = '[' + entry.sid + '] ' + prefix;
      }

      if (entry.cid) {
        prefix = '[#' + entry.cid + '] ' + prefix;
      }
    }

    message = util.format(message, ...args);
    message.split(/\r?\n/).forEach(line => {
      const winstonNpmLevel = nodeMailerLogLevelToWinstonNpmLevels[level];
      winstonLogger.log(winstonNpmLevel, prefix + line);
    });
  };

  let logger = {};
  levels.forEach((level) => {
    logger[level] = print.bind(null, level);
  });

  return logger;
}

/**
 * Returns a bunyan-compatible logger interface. Uses either provided logger or
 * creates a default console logger
 *
 * @return {Object} bunyan compatible logger
 */
const getLogger = () => {
  let response = {};
  const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
  let logger = createDefaultLogger(levels);

  levels.forEach(level => {
    response[level] = (data, message, ...args) => {
      logFunc(logger, level, data, message, ...args);
    };
  });

  return response;
};

module.exports = {
  getLogger
};
