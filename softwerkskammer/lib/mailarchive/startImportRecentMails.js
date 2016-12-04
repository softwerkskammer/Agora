'use strict';
const path = require('path');
const async = require('async');

const maxAgeInDays = process.argv[2];

/*eslint no-sync: 0 */
const winston = require('winston-config').fromFileSync(path.join(__dirname, '../../../config/winston-config.json'));
const logger = winston.loggers.get('scripts');

const beans = require('../../configure').get('beans');
const persistence = beans.get('mailsPersistence');
const ezmlmAdapter = beans.get('ezmlmAdapter');
const importMail = require('./importMails');

function closeAndExit() {
  /* eslint no-process-exit: 0 */
  return persistence.closeDB(() => process.exit());
}

function importIt(filename, listname, callback) {
  importMail(filename, listname, (err, mailDbObject) => {
    if (err) {
      logger.error('Error during import, exiting process: ' + err);
      return callback(err);
    }

    persistence.save(mailDbObject, err1 => {
      if (err1) { logger.error('Error during save: ' + err1); }
      logger.info('Subject of eMail: ' + mailDbObject.subject);
      callback(err1);
    });
  });
}

logger.info('== Import Mails ==========================================================================');

ezmlmAdapter.getAllAvailableLists((err, listnames) => {
  if (err) {
    logger.error('Error during retrieval of all lists, exiting process: ' + err);
    return closeAndExit();
  }
  async.each(listnames,
    (listname, callback) => {
      logger.info('== Import Started for List ' + listname);
      ezmlmAdapter.archivedMails(listname, maxAgeInDays, (err1, filenames) => {
        if (err1) {
          logger.error('Error during retrieval of archived mails, exiting process: ' + err1);
          return callback(err1);
        }
        async.each(filenames,
          (filename, cb) => importIt(filename, listname, cb),
          err2 => {
            logger.info('== Import Finished for List ' + listname);
            callback(err2);
          });
      });
    },
    closeAndExit
  );
});

