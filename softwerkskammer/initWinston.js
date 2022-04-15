'use strict';

const {format, loggers, transports} = require('winston');
const fs = require('fs');

function console(options) {
  let consoleformat;
  if (options.colorize) {
    consoleformat = format.combine(
      format.colorize(),
      format.timestamp(),
      format.prettyPrint(),
      format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
    );
  } else {
    consoleformat = format.combine(
      format.timestamp(),
      format.prettyPrint(),
      format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
    );
  }

  return new transports.Console({format: consoleformat});
}

function fileFrom(options) {
  const fileformat = format.combine(
    format.timestamp(),
    format.prettyPrint(),
    format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
  );

  return new transports.File({
    format: fileformat,
    filename: options.filename,
    maxFiles: options.maxFiles,
    maxsize: 10485760,
  });
}

module.exports = function initWinston(filename) {
  // eslint-disable-next-line no-sync
  const winstonConfig = JSON.parse(fs.readFileSync(filename));

  const loggerDescriptions = Object.entries(winstonConfig.logging);

  loggerDescriptions.forEach(desc => {
    const content = desc[1];
    const trans = [];
    if (content.console) {
      trans.push(console(content.console));
    }
    if (content.file) {
      trans.push(fileFrom(content.file));
    }
    const options = {level: content.level || content.file.level, transports: trans};
    loggers.add(desc[0], options);
  });
};
