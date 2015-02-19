'use strict';
var path = require('path');
var fs = require('fs');
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
  return persistence.closeDB(function () { process.exit(); });
}

function importIt(filename, listname, callback) {
  importMail(filename, listname, function (err, mailDbObject) {
    if (err) {
      logger.error('Error during import, exiting process: ' + err);
      return callback(err);
    }

    persistence.save(mailDbObject, function (err) {
      if (err) { logger.error('Error during save: ' + err); }
      logger.info('Subject of eMail: ' + mailDbObject.subject);
      callback(err);
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
      ezmlmAdapter.archivedMails(listname, maxAgeInDays, function (err, filenames) {
        if (err) {
          logger.error('Error during retrieval of archived mails, exiting process: ' + err);
          return callback(err);
        }
        async.each(filenames,
          function (filename, callback) {
            importIt(filename, listname, callback);
          },
          function (err) {
            logger.info('== Import Finished for List ' + listname);
            callback(err);
          });
      });
    },
    function () {
      closeAndExit();
    });
});

