/*eslint no-process-exit: 0 */
/* eslint no-console: 0 */
'use strict';

require('./configure'); // initializing parameters
const beans = require('simple-configure').get('beans');
const memberstore = beans.get('memberstore');

const really = process.argv[2];
if (!really || really !== 'really') {
  console.log('If you want to run this script, append "really" to the command line.');
  process.exit();
}

memberstore.allMembers((err, members) => {
  if (err) {
    console.log(err);
    process.exit();
  }
  const googleOnlyMembers = members.filter(member => member.authentications().length === 1 && member.authentications()[0].indexOf('https://plus.google.com/') !== -1);

  googleOnlyMembers.forEach(member => console.log(member.displayName()));
  console.log(googleOnlyMembers.length + ' members can only authenticate via Google Plus');
  process.exit();

});
