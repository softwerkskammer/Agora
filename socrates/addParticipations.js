/*eslint no-process-exit: 0 */
/* eslint no-console: 0 */
'use strict';

require('./configure'); // initializing parameters
const async = require('async');
const beans = require('simple-configure').get('beans');
const activityParticipantService = beans.get('activityParticipantService');
const managementService = beans.get('managementService');

const subscriberstore = beans.get('subscriberstore');
const persistence = beans.get('subscribersPersistence');

const really = process.argv[2];

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

activityParticipantService.getParticipantsFor(2016, (err, participants) => {
  handle(err);
  managementService.addonLinesOf(participants, (err1, addonLines) => {
    handle(err1);
    addonLines.forEach(line => console.log(line.member.displayName() + ' # ' + JSON.stringify(line.participation)));
    const brokenLines = addonLines.filter(line => !line.participation.state);
    async.map(brokenLines,
      (line, callback) => {
        subscriberstore.getSubscriber(line.member.id(), (err2, subscriber) => {
          if (err2 || !subscriber) { callback(err); }
          console.log(line.member.displayName());
          subscriber.fillFromUI({hasParticipationInformation: true});
          callback(null, subscriber);
        });
      },
      (errs, fixedSubscribers) => {
        handle(errs);
        async.each(fixedSubscribers, subscriberstore.saveSubscriber, errs2 => {
          handle(errs2);
          closeDBsAndExit();
        });
      });
  });
});

