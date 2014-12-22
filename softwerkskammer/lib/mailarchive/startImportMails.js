'use strict';
var path = require('path');
var file = process.argv[2];
var group = process.argv[3].replace(/@softwerkskammer\.org/g, ''); // remove trailing domain

/*jslint stupid: true */
var winston = require('winston-config').fromFileSync(path.join(__dirname, '../../../config/winston-config.json'));
/*jslint stupid: false */
var logger = winston.loggers.get('scripts');

var persistence = require('../../configure').get('beans').get('mailsPersistence');

function closeAndExit() {
  return persistence.closeDB(function () { process.exit(); });
}

logger.info('== Import Mails ==========================================================================');
require('./importMails')(file, group, function (err, mailDbObject) {
  if (err) {
    logger.error('Error during import, exiting process: ' + err);
    return closeAndExit();
  }

  persistence.save(mailDbObject, function (err) {
    if (err) { logger.error('Error during save: ' + err); }
    logger.info('Subject of eMail: ' + mailDbObject.subject);
    return closeAndExit();
  });
});
