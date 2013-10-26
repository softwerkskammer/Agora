'use strict';

require('./configure'); // initializing parameters
var async = require('async');

var beans = require('nconf').get('beans');
var persistence = beans.get('membersPersistence');
var Member = beans.get('member');

var really = process.argv[2];

if (!really || really !== 'really') {
  console.log('If you really want to migrate the activities, appen "really" to the command line.');
  process.exit();
}

function logResult(err, message) {
  if (err) { return console.log('An error occurred: ' + err); }
  console.log(message);
}

console.log('Migrating all existing members...');
persistence.list({}, function (err, members) {
  async.map(members, function (memberObject, callback) {
    var member = new Member(memberObject);
    member.addAuthentication(member.id);
    callback(null, member);
  }, function (err, results) {
    persistence.saveAll(results, function (err) {
      logResult(err, 'All existing members are now migrated.');
      process.exit();
    });
  });
});
