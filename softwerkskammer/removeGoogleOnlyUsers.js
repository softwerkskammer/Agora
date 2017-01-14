/*eslint no-process-exit: 0 */
/* eslint no-console: 0 */
'use strict';

const async = require('async');
require('./configure'); // initializing parameters
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
      (group, cb2) => gamService.unsubscribeMemberFromGroup(member, group.id, cb2),
      // callback when the one member has been unsubscribed from all groups:
      err1 => {
        if (err1) { return cb1(); }

        memberstore.isSoCraTesSubscriber(member.id, (err2, isSubscriber) => {
          if (err2) {return cb1(); }
          if (!isSubscriber) {
            console.log('About to remove ' + member.displayName());
            memberstore.removeMember(member, cb1);
          } else {
            console.log('Not removing ' + member.displayName() + ' because of SoCraTes membership');
            cb1(); // in the first round, we only delete the non-SoCraTes members
          }
        });
      }),
    // callback when all members have been handled:
    () => process.exit());

});
