'use strict';

require('./configure'); // initializing parameters
var _ = require('lodash');
var async = require('async');
var beans = require('simple-configure').get('beans');
var participantService = beans.get('participantService');
var groupsAndMembersService = beans.get('groupsAndMembersService');

var really = process.argv[2];
var doSave = process.argv[3] === 'doSave';
if (!really || really !== 'really') {
  console.log('If you want to test the migration, append "really" to the command line.');
  console.log('If you really want to save, append "doSave" after "really" to the command line.');
  process.exit();
}

var count = 1;
groupsAndMembersService.getAllUsersWithTheirGroups(function (err, members) {
  async.each(members,
    function (member, callback) {
      // set to true if member is in SoCraTes group
      var isSocratesVisitor = _.pluck(member.subscribedGroups, 'id').indexOf('socrates2014') > -1;
      if (isSocratesVisitor) {
        console.log('Socrates-Visitor + ' + count + ': ' + member.displayName());
        count = count + 1;
        if (doSave) {
          return participantService.createParticipantIfNecessaryFor(member.id(), callback);
        }
      }
      callback(null, null);
    },
    function (err) {
      if (err) { console.log(err); }
      process.exit();
    });
});
