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
    logger.error(err);
    process.exit();
  }
  var yesterday = moment().subtract(1, 'days');
  var lastNotified = result || {id: 'lastWikiNotifications', moment: yesterday.toDate()};
  logger.info("Last notified: " + util.inspect(result));
  wikiService.findPagesForDigestSince(moment(lastNotified.moment), function (err, changes) {
    if (err) {
      logger.error(err);
      process.exit();
    }
    if (changes.length === 0) {
      logger.info('no changes to report');
    }
    notifications.wikiChanges(changes, function (err, stringifiedOptions) {
      if (err) {
        logger.error(err);
        process.exit();
      }
      lastNotified.moment = moment().toDate();
      persistence.save(lastNotified, function (err) {
        if (err) {
          logger.error(err);
          process.exit();
        }
        logger.info("Wiki-Changes notified at: " + lastNotified);
        logger.info("Options were returned: " + !!stringifiedOptions);
        process.exit();
      });
    });
  });
});


