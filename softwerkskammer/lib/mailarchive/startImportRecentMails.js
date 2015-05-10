'use strict';
var path = require('path');
var async = require('async');

var maxAgeInDays = process.argv[2];

/*jslint stupid: true */
var winston = require('winston-config').fromFileSync(path.join(__dirname, '../../../config/winston-config.json'));
/*jslint stupid: false */
var logger = winston.loggers.get('scripts');

var beans = require('../../configure').get('beans');
var persistence = beans.get('mailsPersistence');
var ezmlmAdapter = beans.get('ezmlmAdapter');
var importMail = require('./importMails');

function closeAndExit() {
  return persistence.closeDB(function () {
    /* eslint no-process-exit: 0 */
    process.exit();
  });
}

function importIt(filename, listname, callback) {
  importMail(filename, listname, function (err, mailDbObject) {
    if (err) {
      logger.error('Error during import, exiting process: ' + err);
      return callback(err);
    }

    persistence.save(mailDbObject, function (err1) {
      if (err1) { logger.error('Error during save: ' + err1); }
      logger.info('Subject of eMail: ' + mailDbObject.subject);
      callback(err1);
    });
  });
}

logger.info('== Import Mails ==========================================================================');

ezmlmAdapter.getAllAvailableLists(function (err, listnames) {
  if (err) {
    logger.error('Error during retrieval of all lists, exiting process: ' + err);
    return closeAndExit();
  }
  async.each(listnames,
    function (listname, callback) {
      logger.info('== Import Started for List ' + listname);
      ezmlmAdapter.archivedMails(listname, maxAgeInDays, function (err1, filenames) {
        if (err1) {
          logger.error('Error during retrieval of archived mails, exiting process: ' + err1);
          return callback(err1);
        }
        async.each(filenames,
          function (filename, cb) { importIt(filename, listname, cb); },
          function (err2) {
            logger.info('== Import Finished for List ' + listname);
            callback(err2);
          });
      });
    },
    function () {
      closeAndExit();
    });
});

