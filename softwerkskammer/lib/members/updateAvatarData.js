/* eslint no-process-exit: 0 */
/* eslint no-console: 0 */
'use strict';

require('../../configure'); // initializing parameters

var async = require('async');
var beans = require('simple-configure').get('beans');
var store = beans.get('memberstore');
var service = beans.get('membersService');

function updateMembersAvatar(member, callback) {
  service.updateImage(member, callback);
}

store.allMembers(function (err, members) {
  if (err || !members) {
    console.log('avatar updater had problems loading members');
  }
  console.log('starting avatar update');
  async.each(members, updateMembersAvatar, function (err1) {
    if (err) {
      console.log('avatar updater encountered an error: ' + err1.message);
    }
    console.log('finishing avatar update');
    process.exit();
  });
});

