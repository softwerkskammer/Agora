/* eslint no-process-exit: 0 */
/* eslint no-console: 0 */
'use strict';

require('./configure'); // initializing parameters
var util = require('util');
var async = require('async');
var beans = require('simple-configure').get('beans');
var subscriberstore = beans.get('subscriberstore');
var activitystore = beans.get('activitystore');

var really = process.argv[2];
var doSave = process.argv[3] === 'doSave';
if (!really || really !== 'really') {
  console.log('If you want to test the migration, append "really" to the command line.');
  console.log('If you really want to save, append "doSave" after "really" to the command line.');
  process.exit();
}

activitystore.getActivity('socrates-2014', function (err, activity) {
  if (err) { return console.log(err); }
  console.log('activity: ' + util.inspect(activity));
  var memberIds = activity.memberIdsOfAddons();

  async.eachSeries(memberIds, function (memberId, callback) {
    console.log('-------');
    subscriberstore.getSubscriber(memberId, function (err1, subscriber) {
      if (err1) {
        console.log('load failed for id ' + memberId + ' : ' + err1);
        return callback(err1);
      }
      console.log('subscriber: ' + util.inspect(subscriber));
      var addon = activity.addonForMember(memberId);
      console.log(' with 2014 addon-state ' + util.inspect(addon.state));
      subscriber.addon().fillFromUI(addon.state);
      console.log('  yields subscriber: ' + util.inspect(subscriber));
      if (doSave) {
        subscriberstore.saveSubscriber(subscriber, function (err2) {
          if (err2) {
            console.log('Save failed: ' + err2);
            return callback(err2);
          }
          callback(null);
        });
      } else {
        callback(null);
      }
    });
  }, function (err1) {
    if (err1) { return console.log(err1); }
    process.exit();
  });
});
