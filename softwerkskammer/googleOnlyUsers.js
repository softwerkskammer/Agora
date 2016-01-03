/*eslint no-process-exit: 0 */
/* eslint no-console: 0 */
'use strict';

require('./configure'); // initializing parameters
var _ = require('lodash');
var beans = require('simple-configure').get('beans');
var memberstore = beans.get('memberstore');

var really = process.argv[2];
if (!really || really !== 'really') {
  console.log('If you want to run this script, append "really" to the command line.');
  process.exit();
}

memberstore.allMembers(function (err, members) {
  if (err) {
    console.log(err);
    process.exit();
  }
  var googleOnlyMembers = _.filter(members, function (member) {
    return member.authentications().length === 1 && member.authentications()[0].indexOf('https://www.google.com/accounts/o8/id?id=') !== -1;
  });

  _.each(googleOnlyMembers, function (member) {
    console.log(member.displayName());
  });
  console.log(googleOnlyMembers.length + ' members can only authenticate via Google OpenID');
  process.exit();

});
