'use strict';

require('./configure'); // initializing parameters
var _ = require('underscore');
var async = require('async');
var moment = require('moment-timezone');
var beans = require('nconf').get('beans');
var persistence = beans.get('waitinglistPersistence');
var activitystore = beans.get('activitystore');
var memberstore = beans.get('memberstore');

var async = require('async');

var really = process.argv[2];

if (!really || really !== 'really') {
  console.log('If you really want to migrate the db, append "really" to the command line.');
  process.exit();
}

// set "socratesOnly" to false for all members.
memberstore.allMembers(function (err, members) {
  async.each(members,
    function (member, callback) {
      member.state.socratesOnly = false;
      memberstore.saveMember(member, callback);
    },
    function (err) {
      if (err) { console.log(err); }
      process.exit();
    });
});

