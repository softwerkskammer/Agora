'use strict';
require('../../configure'); // initializing parameters
var beans = require('nconf').get('beans');
var wikiService = beans.get('wikiService');
var notifications = beans.get('notifications');
var persistence = beans.get('settingsPersistence');
var moment = require('moment-timezone');

persistence.getByField({id: 'lastWikiNotifications'}, function (err, result) {
  if (err) {
    console.log(err);
    process.exit();
  }
  var yesterday = moment().subtract('days', 1);
  var lastNotified = result || {id: 'lastWikiNotifications', moment: yesterday.toDate()};
  wikiService.findPagesForDigestSince(moment(lastNotified.moment), function (err, changes) {
    if (err || changes.length === 0) {
      console.log('no changes to report');
      process.exit();
    }
    notifications.wikiChanges(changes, function (err, stringifiedOptions) {
      if (err) { console.log(err); }
      lastNotified.moment = moment().toDate();
      persistence.save(lastNotified, function (err) {
        if (err) { console.log(err); }
        console.log(stringifiedOptions);
        process.exit();
      });
    });
  });
});


