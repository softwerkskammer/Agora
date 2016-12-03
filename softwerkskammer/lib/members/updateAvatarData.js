/* eslint no-process-exit: 0 */
/* eslint no-console: 0 */
'use strict';

require('../../configure'); // initializing parameters

const R = require('ramda');
const async = require('async');
const beans = require('simple-configure').get('beans');
const store = beans.get('memberstore');
const service = beans.get('membersService');

store.allMembers((err, members) => {
  if (err || !members) { console.log('avatar updater had problems loading members'); }
  store.socratesOnlyMembers((err1, socMembers) => {
    if (err1 || !members) { console.log('avatar updater had problems loading members'); }
    console.log('starting avatar update');
    async.each(R.concat(members, socMembers), service.updateImage, err2 => {
      if (err2) {
        console.log('avatar updater encountered an error: ' + err2.message);
      }
      console.log('finishing avatar update');
      process.exit();
    });
  });
});
