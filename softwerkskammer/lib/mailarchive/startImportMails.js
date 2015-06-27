'use strict';
var path = require('path');
var file = process.argv[2];
var group = process.argv[3].replace(/@softwerkskammer\.org/g, ''); // remove trailing domain

/*eslint no-sync: 0 */
var winston = require('winston-config').fromFileSync(path.join(__dirname, '../../../config/winston-config.json'));
var logger = winston.loggers.get('scripts');

var persistence = require('../../configure').get('beans').get('mailsPersistence');

function closeAndExit() {
  /* eslint no-process-exit: 0 */
  return persistence.closeDB(function () { process.exit(); });
}

logger.info('== Import Mails ==========================================================================');
require('./importMails')(file, group, function (err, mailDbObject) {
  if (err) {
    logger.error('Error during import, exiting process: ' + err);
    return closeAndExit();
  }

  persistence.save(mailDbObject, function (err1) {
    if (err1) { logger.error('Error during save: ' + err1); }
    logger.info('Subject of eMail: ' + mailDbObject.subject);
    return closeAndExit();
  });
});
