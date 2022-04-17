require('../../configure'); // initializing parameters
const path = require('path');

const winstonConfigPath = path.join(__dirname, '../../../config/winston-config.json');
require('../../initWinston')(winstonConfigPath);

const winston = require('winston');
const logger = winston.loggers.get('scripts');

const beans = require('simple-configure').get('beans');
// open persistence AFTER logger is created
const persistence = beans.get('settingsPersistence');
const wikiService = beans.get('wikiService');
const notifications = beans.get('notifications');
const util = require('util');

const lastNotifications = 'lastWikiNotifications';

function closeAndExit() {
  persistence.closeDB(() => {
    /* eslint no-process-exit: 0 */
    logger.info('Terminating the process.......');
    process.exit();
  });
}

logger.info('== Wiki Changes ==========================================================================');
persistence.getByField({id: lastNotifications}, (err, result) => {
  if (err) {
    logger.error('Error when reading lastWikiNotifications: ' + err);
    return closeAndExit();
  }
  logger.info('No error when reading lastWikiNotifications');
  const yesterday = new Date(Date.now() - 86400000); // minus 1 day
  const lastNotified = result || {id: lastNotifications, moment: yesterday}; // moment here is a Date
  if (result) {
    logger.info('Last notified: ' + util.inspect(result.moment));
  }
  wikiService.findPagesForDigestSince(lastNotified.moment.getTime(), (err1, changes) => {
    /* eslint no-console: 0 */

    if (err1) {
      logger.error('Error when finding pages for Digest: ' + err1);
      console.log('Error when finding pages for Digest: ' + err1); // for cron mail
      return closeAndExit();
    }
    if (changes.length === 0) {
      logger.info('no changes to report');
      return closeAndExit();
    }
    notifications.wikiChanges(changes, err2 => {
      if (err2) {
        logger.error(err2);
        console.log(err2); // for cron mail
        return closeAndExit();
      }
      lastNotified.moment = new Date();
      persistence.save(lastNotified, err3 => {
        if (err3) {
          logger.error(err3);
          console.log(err3); // for cron mail
          return closeAndExit();
        }
        logger.info('Wiki-Changes notified at: ' + lastNotified.moment);
        return closeAndExit();
      });
    });
  });
});


