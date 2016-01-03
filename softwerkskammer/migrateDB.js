/*eslint no-process-exit: 0 */
/* eslint no-console: 0 */
'use strict';

require('./configure'); // initializing parameters
var _ = require('lodash');
var async = require('async');
var beans = require('simple-configure').get('beans');
var memberstore = beans.get('memberstore');
var groupsAndMembersService = beans.get('groupsAndMembersService');

var really = process.argv[2];
var doSave = process.argv[3] === 'doSave';
if (!really || really !== 'really') {
  console.log('If you want to test the migration, append "really" to the command line.');
  console.log('If you really want to save, append "doSave" after "really" to the command line.');
  process.exit();
}

// set "socratesOnly" to false for all members.
groupsAndMembersService.getAllMembersWithTheirGroups(function (err, members) {
  if (err) {
    console.log(err);
    process.exit();
  }
  async.each(members,
    function (member, callback) {
      // set to true if member is only in socrates list
      var groups = _(member.subscribedGroups).pluck('id').filter(function (groupId) {
        return groupId !== 'alle' && groupId !== 'commercial';
      }).value();

      member.state.socratesOnly = groups.length === 1 && groups[0] === 'socrates2014';

      if (member.state.socratesOnly) {
        console.log('Socrates-only: ' + member.displayName());
      }
      if (doSave) {
        return memberstore.saveMember(member, callback);
      }
      callback(null, null);
    },
    function (err1) {
      if (err1) { console.log(err1); }
      process.exit();
    });
});
