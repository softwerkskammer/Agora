'use strict';
var path = require('path');
require('../../configure'); // initializing parameters
var beans = require('nconf').get('beans');
var wikiService = beans.get('wikiService');
var notifications = beans.get('notifications');
var persistence = beans.get('settingsPersistence');
var moment = require('moment-timezone');
var util = require('util');

/*jslint stupid: true */
var winston = require('winston-config').fromFileSync(path.join(__dirname, '../../../config/winston-config.json'));
/*jslint stupid: false */
var logger = winston.loggers.get('scripts');

logger.info('== Wiki Changes ==========================================================================');
persistence.getByField({id: 'lastWikiNotifications'}, function (err, result) {
  if (err) {
    logger.error('Error when reading lastWikiNotifications: ' + err);
    persistence.closeDB();
    process.exit();
  }
  var yesterday = moment().subtract(1, 'days');
  var lastNotified = result || {id: 'lastWikiNotifications', moment: yesterday.toDate()};
  logger.info("Last notified: " + util.inspect(result.moment));
  wikiService.findPagesForDigestSince(moment(lastNotified.moment), function (err, changes) {
    if (err) {
      logger.error("Error when finding pages for Digest: " + err);
      persistence.closeDB();
      process.exit();
    }
    if (changes.length === 0) {
      logger.info('no changes to report');
      console.log('no changes to report'); // for cron mail
      persistence.closeDB();
      process.exit();
    }
    notifications.wikiChanges(changes, function (err, stringifiedOptions) {
      if (err) {
        logger.error(err);
        persistence.closeDB();
        process.exit();
      }
      lastNotified.moment = moment().toDate();
      persistence.save(lastNotified, function (err) {
        if (err) {
          logger.error(err);
          persistence.closeDB();
          process.exit();
        }
        logger.info("Wiki-Changes notified at: " + lastNotified.moment);
        logger.info("Options were returned: " + !!stringifiedOptions);
        persistence.closeDB();
        console.log('wiki-changes were reported'); // for cron mail
        process.exit();
      });
    });
  });
});


