'use strict';

require('./configure'); // initializing parameters
var _ = require('lodash');
var async = require('async');
var beans = require('simple-configure').get('beans');
var subscriberService = beans.get('subscriberService');
var memberstore = beans.get('memberstore');

var really = process.argv[2];
var doSave = process.argv[3] === 'doSave';
if (!really || really !== 'really') {
  console.log('If you want to test the migration, append "really" to the command line.');
  console.log('If you really want to save, append "doSave" after "really" to the command line.');
  process.exit();
}

var count = 1;
memberstore.socratesOnlyMembers(function (err, members) {
  async.each(members,
    function (member, callback) {
      console.log('Socrates-Only ' + count + ': ' + member.displayName());
      count = count + 1;
      if (doSave) {
        return subscriberService.createSubscriberIfNecessaryFor(member.id(), callback);
      }
      callback(null, null);
    },
    function (err) {
      if (err) { console.log(err); }
      process.exit();
    });
});
