'use strict';
const path = require('path');
const file = process.argv[2];
const group = process.argv[3].replace(/@softwerkskammer\.org/g, ''); // remove trailing domain

/*eslint no-sync: 0 */
const winston = require('winston-config').fromFileSync(path.join(__dirname, '../../../config/winston-config.json'));
const logger = winston.loggers.get('scripts');

const persistence = require('../../configure').get('beans').get('mailsPersistence');

function closeAndExit() {
  /* eslint no-process-exit: 0 */
  return persistence.closeDB(() => process.exit());
}

logger.info('== Import Mails ==========================================================================');
require('./importMails')(file, group, (err, mailDbObject) => {
  if (err) {
    logger.error('Error during import, exiting process: ' + err);
    return closeAndExit();
  }

  persistence.save(mailDbObject, err1 => {
    if (err1) { logger.error('Error during save: ' + err1); }
    logger.info('Subject of eMail: ' + mailDbObject.subject);
    return closeAndExit();
  });
});
