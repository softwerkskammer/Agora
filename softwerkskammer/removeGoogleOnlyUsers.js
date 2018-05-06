/*eslint no-process-exit: 0 */
/* eslint no-console: 0 */
'use strict';

const async = require('async');
require('./../softwerkskammer/configure'); // initializing parameters
const beans = require('simple-configure').get('beans');
const memberstore = beans.get('memberstore');
const gamService = beans.get('groupsAndMembersService');

const really = process.argv[2];
if (!really || really !== 'really') {
  console.log('If you want to run this script, append "really" to the command line.');
  process.exit();
}

gamService.getAllMembersWithTheirGroups((err, members) => {
  if (err) {
    console.log(err);
    process.exit();
  }
  const googleOnlyMembers = members.filter(member => member.authentications().length === 1 && member.authentications()[0].indexOf('https://www.google.com/accounts/o8/id?id=') !== -1);

  console.log(googleOnlyMembers.length + ' members can only authenticate via Google OpenID');

  async.each(
    googleOnlyMembers,
    (member, cb1) => async.each(
      member.subscribedGroups,
      (group, cb2) => {
        console.log('Unsubscribing ' + member.displayName() + ' from ' + group.longName);
        gamService.unsubscribeMemberFromGroup(member, group.id, cb2);
      },
      // callback when the one member has been unsubscribed from all groups:
      err1 => {
        if (err1) { return cb1(err1); }

        console.log('About to remove SWK member ' + member.displayName());
        return memberstore.removeMember(member, cb1);
      }),
    // callback when all members have been handled:
    () => process.exit()
  );

});
