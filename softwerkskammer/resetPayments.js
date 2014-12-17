'use strict';

require('./configure'); // initializing parameters
var _ = require('lodash');
var beans = require('simple-configure').get('beans');
var activitystore = beans.get('activitystore');

var really = process.argv[2];

if (!really || really !== 'really') {
  console.log('If you really want to migrate the db, append "really" to the command line.');
  process.exit();
}

activitystore.getActivity('socrates-2014', function (err, activity) {

  _.each(activity.allRegisteredMembers(), function (name) {
    var addon = activity.addonForMember(name);
    delete addon.state.paymentReceived;
  });

  activitystore.saveActivity(activity, function (err) {
    if (err) {
      console.log(err);
      process.exit();
    }
    process.exit();
  });
});


