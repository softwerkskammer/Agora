/*eslint no-process-exit: 0 */
/* eslint no-console: 0 */
'use strict';

const async = require('async');
const {DateTime} = require('luxon');

require('./configure'); // initializing parameters
const beans = require('simple-configure').get('beans');
const activitystore = beans.get('activitystore');

let really = process.argv[2];
const icuDataDir = process.execArgv.find(arg => arg.match(/--icu-data-dir/));

if (!icuDataDir) {
  console.log('You need to specify the icu-data-dir');
  process.exit();
}

if (!really || really !== 'really') {
  console.log('If you want to run this script, append "really" to the command line.');
  process.exit();
}

function updateDatesInActivity(activity) {
  const start = (activity.state.startUnix && !isNaN(activity.state.startUnix)) ? DateTime.fromMillis(activity.state.startUnix * 1000) : DateTime.local();
  activity.state.startDate = start.set({millisecond: 0, second: 0}).setZone('Europe/Berlin').toJSDate();

  const end = (activity.state.endUnix && !isNaN(activity.state.endUnix)) ? DateTime.fromMillis(activity.state.endUnix * 1000) : DateTime.local();
  activity.state.endDate = end.set({millisecond: 0, second: 0}).setZone('Europe/Berlin').toJSDate();
}

activitystore.allActivities((err, activities) => {
  if (err) {
    console.log(err);
    process.exit();
  }
  async.eachSeries(
    activities, (activity, callback) => {
      updateDatesInActivity(activity);
      activitystore.saveActivity(activity, (err2, res) => {
        console.log(res);
        callback(err2, res);
      });
    }, (err1) => {
      if (err1) {
        console.log(err1);
        process.exit();
      }
      process.exit();
    }
  );

});
