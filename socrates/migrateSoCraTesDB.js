'use strict';

require('./configure'); // initializing parameters
var _ = require('lodash');
var util = require('util');
var async = require('async');
var beans = require('simple-configure').get('beans');
var subscriberService = beans.get('subscriberService');
var memberstore = beans.get('memberstore');
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
    subscriberstore.getSubscriber(memberId, function (err, subscriber) {
      if (err) {
        console.log('load failed for id ' + memberId + ' : ' + err);
        return callback(err);
      }
      console.log('subscriber: ' + util.inspect(subscriber));
      var addon = activity.addonForMember(memberId);
      console.log(' with 2014 addon-state ' + util.inspect(addon.state));
      subscriber.addon().fillFromUI(addon.state);
      console.log('  yields subscriber: ' + util.inspect(subscriber));
      if (doSave) {
        subscriberstore.saveSubscriber(subscriber, function (err) {
          if (err) {
            console.log('Save failed: ' + err);
            return callback(err);
          }
          callback(null);
        });
      } else {
        callback(null);
      }
    });
  }, function (err) {
    if (err) { return console.log(err); }
    process.exit();
  });
});
