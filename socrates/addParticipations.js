/*eslint no-process-exit: 0 */
/* eslint no-console: 0 */
'use strict';

require('./configure'); // initializing parameters
var async = require('async');
var beans = require('simple-configure').get('beans');
var activityParticipantService = beans.get('activityParticipantService');
var managementService = beans.get('managementService');

var subscriberstore = beans.get('subscriberstore');
var persistence = beans.get('subscribersPersistence');

var really = process.argv[2];

if (!really || really !== 'really') {
  console.log('If you really want to rename the group, append "really" to the command line.');
  process.exit();
}

function closeDBsAndExit() {
  persistence.closeDB();
  process.exit();
}

function handle(err) {
  if (err) {
    console.log(err);
    closeDBsAndExit();
  }
}

activityParticipantService.getParticipantsFor(2016, function (err, participants) {
  handle(err);
  managementService.addonLinesOf(participants, function (err1, addonLines) {
    handle(err1);
    addonLines.forEach(line => console.log(line.member.displayName() + ' # ' + JSON.stringify(line.participation)));
    const brokenLines = addonLines.filter(line => !line.participation.state);
    async.map(brokenLines,
      function (line, callback) {
        subscriberstore.getSubscriber(line.member.id(), function (err2, subscriber) {
          if (err2 || !subscriber) { callback(err); }
          console.log(line.member.displayName());
          subscriber.fillFromUI({hasParticipationInformation: true});
          callback(null, subscriber);
        });
      },
      function (errs, fixedSubscribers) {
        handle(errs);
        async.each(fixedSubscribers, subscriberstore.saveSubscriber, function (errs2) {
          handle(errs2);
          closeDBsAndExit();
        });
      });
  });
});

