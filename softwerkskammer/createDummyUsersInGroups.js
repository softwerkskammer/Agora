/*eslint no-process-exit: 0 */
/* eslint no-console: 0 */
'use strict';

const async = require('async');

require('./configure'); // initializing parameters
const beans = require('simple-configure').get('beans');
const memberstore = beans.get('memberstore');
const mailPersistence = beans.get('mailinglistPersistence');

const really = process.argv[2];
if (!really || really !== 'really') {
  console.log('This script randomly joins existing users with existing groups.');
  console.log('If you want to run this script, append "really" to the command line.');
  process.exit();
}

memberstore.allMembers((err, members) => {
  if (err) {
    console.log(err);
    process.exit();
  }
  const emails = members.map(m => m.email());

  function addEmailsToListAndSave(list, cb) {
    // eslint-disable-next-line no-unused-vars
    list.users = emails.filter(e => Math.random() < 0.5);
    console.log('saving ' + list.users.length + ' users an Liste ' + list.id);
    mailPersistence.save(list, cb);
  }

  mailPersistence.list({id: 1}, (err1, lists) => {
    if (err1) {
      console.log(err1);
      process.exit();
    }
    async.each(lists, addEmailsToListAndSave, finalErr => {
      if (finalErr) {
        console.log(finalErr);
        process.exit();
      }
    });
  });

});
