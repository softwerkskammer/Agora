/*eslint no-process-exit: 0 */
/* eslint no-console: 0 */
'use strict';

const async = require('async');
require('./../socrates/configure'); // initializing parameters
const beans = require('simple-configure').get('beans');
const memberstore = beans.get('memberstore');
const gamService = beans.get('groupsAndMembersService');
const subscriberService = beans.get('subscriberService');
const subscriberstore = beans.get('subscriberstore');

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

        memberstore.isSoCraTesSubscriber(member.id, (err2, isSubscriber) => {
          if (err2) { return cb1(err2); }

          if (!isSubscriber) {
            console.log('About to remove SWK member ' + member.displayName());
            return memberstore.removeMember(member, cb1);
          }

          subscriberstore.getSubscriber(member.id, (err3, subscriber) => {
            if (!subscriber || err3) { return cb1(err3); }
            console.log('Removing SoCraTes member ' + member.displayName());
            subscriberService.removeSubscriber(subscriber, err4 => {
              if (err4) { return cb1(err4); }
              console.log('Then, removing SWK member ' + member.displayName());
              memberstore.removeMember(member, cb1);
            });
          });
        });
      }),
    // callback when all members have been handled:
    () => process.exit()
  );

});
