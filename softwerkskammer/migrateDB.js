'use strict';

require('./configure'); // initializing parameters
var _ = require('underscore');
var async = require('async');
var moment = require('moment-timezone');
var beans = require('nconf').get('beans');
var persistence = beans.get('waitinglistPersistence');
var activitystore = beans.get('activitystore');
var memberstore = beans.get('memberstore');
var groupsService = beans.get('groupsService');

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
      groupsService.getSubscribedGroupsForUser(member.email(), function (err, lists) {
        // set to true if member is only in socrates list
        member.state.socratesOnly = lists.length === 1 && lists[0].id === 'socrates2014';
        if (member.state.socratesOnly) {
          console.log("Socrates-only: " + member.displayName());
        }
        memberstore.saveMember(member, callback);
      });
    },
    function (err) {
      if (err) { console.log(err); }
      process.exit();
    });
});

