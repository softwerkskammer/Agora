'use strict';
var path = require('path');
require('../../configure'); // initializing parameters
/*jslint stupid: true */
var winston = require('winston-config').fromFileSync(path.join(__dirname, '../../../config/winston-config.json'));
/*jslint stupid: false */
var logger = winston.loggers.get('scripts');

var beans = require('simple-configure').get('beans');
// open persistence AFTER logger is created
var persistence = beans.get('settingsPersistence');
var wikiService = beans.get('wikiService');
var notifications = beans.get('notifications');
var moment = require('moment-timezone');
var util = require('util');


function closeAndExit() {
  return persistence.closeDB(function () {
    logger.info('Terminating the process.......');
    process.exit();
  });
}

logger.info('== Wiki Changes ==========================================================================');
persistence.getByField({id: 'lastWikiNotifications'}, function (err, result) {
  if (err) {
    logger.error('Error when reading lastWikiNotifications: ' + err);
    return closeAndExit();
  }
  logger.info('No error when reading lastWikiNotifications');
  var yesterday = moment().subtract(1, 'days');
  var lastNotified = result || {id: 'lastWikiNotifications', moment: yesterday.toDate()};
  logger.info("Last notified: " + util.inspect(result.moment));
  wikiService.findPagesForDigestSince(moment(lastNotified.moment), function (err, changes) {
    if (err) {
      logger.error("Error when finding pages for Digest: " + err);
      return closeAndExit();
    }
    if (changes.length === 0) {
      logger.info('no changes to report');
      console.log('no changes to report'); // for cron mail
      return closeAndExit();
    }
    notifications.wikiChanges(changes, function (err) {
      if (err) {
        logger.error(err);
        return closeAndExit();
      }
      lastNotified.moment = moment().toDate();
      persistence.save(lastNotified, function (err) {
        if (err) {
          logger.error(err);
          return closeAndExit();
        }
        logger.info('Wiki-Changes notified at: ' + lastNotified.moment);
        console.log('wiki-changes were reported'); // for cron mail
        return closeAndExit();
      });
    });
  });
});


