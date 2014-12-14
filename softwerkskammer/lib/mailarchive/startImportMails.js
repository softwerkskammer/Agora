'use strict';
var path = require('path');
var conf = require('../../configure');
var persistence = conf.get('beans').get('mailsPersistence');
var file = process.argv[2];
var group = process.argv[3].replace(/@softwerkskammer\.org/g, ''); // remove trailing domain

/*jslint stupid: true */
var winston = require('winston-config').fromFileSync(path.join(__dirname, '../../../config/winston-config.json'));
/*jslint stupid: false */
var logger = winston.loggers.get('scripts');

logger.info('== Import Mails ==========================================================================');
require('./importMails')(file, group, logger, function (err, mailDbObject) {
  if (err) {
    logger.error(err);
    persistence.closeDB();
    logger.info('Error, want to exit process here');
    // process.exit(); ???
  } else {
    persistence.save(mailDbObject, function (err) {
      if (err) { logger.error(err); }
      logger.info('Subject of eMail: ' + mailDbObject.subject);
      persistence.closeDB();
      logger.info('Saved, want to exit process here');
      // process.exit(); ???
    });
  }
});
