'use strict';
const path = require('path');
require('../../configure'); // initializing parameters

/*eslint no-sync: 0 */
const winston = require('winston-config').fromFileSync(path.join(__dirname, '../../../config/winston-config.json'));
const logger = winston.loggers.get('scripts');

const beans = require('simple-configure').get('beans');
// open persistence AFTER logger is created
const persistence = beans.get('settingsPersistence');
const wikiService = beans.get('wikiService');
const notifications = beans.get('socratesNotifications');
const moment = require('moment-timezone');
const util = require('util');

const lastNotifications = 'lastWikiNotificationsSoCraTes';

function closeAndExit() {
  return persistence.closeDB(() => {
    /* eslint no-process-exit: 0 */
    logger.info('Terminating the process.......');
    process.exit();
  });
}

logger.info('== SoCraTes Wiki Changes ==========================================================================');
persistence.getByField({id: lastNotifications}, (err, result) => {
  if (err) {
    logger.error('Error when reading lastWikiNotificationsSoCraTes: ' + err);
    return closeAndExit();
  }
  logger.info('No error when reading lastWikiNotificationsSoCraTes');
  const yesterday = moment().subtract(1, 'days');
  const lastNotified = result || {id: lastNotifications, moment: yesterday.toDate()};
  if (result) {
    logger.info('Last notified: ' + util.inspect(result.moment));
  }
  wikiService.findPagesForDigestSince(moment(lastNotified.moment), (err1, changes) => {
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
    notifications.wikiChanges(changes, err2 => {
      if (err2) {
        logger.error(err2);
        return closeAndExit();
      }
      lastNotified.moment = moment().toDate();
      persistence.save(lastNotified, err3 => {
        if (err3) {
          logger.error(err3);
          return closeAndExit();
        }
        logger.info('SoCraTes Wiki-Changes notified at: ' + lastNotified.moment);
        console.log('SoCraTes wiki-changes were reported'); // for cron mail
        return closeAndExit();
      });
    });
  });
});


