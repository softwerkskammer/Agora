'use strict';
var path = require('path');
require('../../configure'); // initializing parameters

/*eslint no-sync: 0 */
var winston = require('winston-config').fromFileSync(path.join(__dirname, '../../../config/winston-config.json'));
var logger = winston.loggers.get('scripts');

var beans = require('simple-configure').get('beans');
// open persistence AFTER logger is created
var persistence = beans.get('settingsPersistence');
var wikiService = beans.get('wikiService');
var notifications = beans.get('notifications');
var moment = require('moment-timezone');
var util = require('util');

var lastNotifications = 'lastWikiNotifications';

function closeAndExit() {
  return persistence.closeDB(function () {
    /* eslint no-process-exit: 0 */
    logger.info('Terminating the process.......');
    process.exit();
  });
}

logger.info('== Wiki Changes ==========================================================================');
persistence.getByField({id: lastNotifications}, function (err, result) {
  if (err) {
    logger.error('Error when reading lastWikiNotifications: ' + err);
    return closeAndExit();
  }
  logger.info('No error when reading lastWikiNotifications');
  var yesterday = moment().subtract(1, 'days');
  var lastNotified = result || {id: lastNotifications, moment: yesterday.toDate()};
  if (result) {
    logger.info('Last notified: ' + util.inspect(result.moment));
  }
  wikiService.findPagesForDigestSince(moment(lastNotified.moment), function (err1, changes) {
    /* eslint no-console: 0 */

    if (err1) {
      logger.error('Error when finding pages for Digest: ' + err1);
      return closeAndExit();
    }
    if (changes.length === 0) {
      logger.info('no changes to report');
      console.log('no changes to report'); // for cron mail
      return closeAndExit();
    }
    notifications.wikiChanges(changes, function (err2) {
      if (err2) {
        logger.error(err2);
        return closeAndExit();
      }
      lastNotified.moment = moment().toDate();
      persistence.save(lastNotified, function (err3) {
        if (err3) {
          logger.error(err3);
          return closeAndExit();
        }
        logger.info('Wiki-Changes notified at: ' + lastNotified.moment);
        console.log('wiki-changes were reported'); // for cron mail
        return closeAndExit();
      });
    });
  });
});


