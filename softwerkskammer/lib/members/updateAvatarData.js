/* eslint no-process-exit: 0 */
/* eslint no-console: 0 */
'use strict';

require('../../configure'); // initializing parameters

var _ = require('lodash');
var async = require('async');
var beans = require('simple-configure').get('beans');
var store = beans.get('memberstore');
var service = beans.get('membersService');

function updateMembersAvatar(member, callback) {
  service.updateImage(member, callback);
}

store.allMembers(function (err, members) {
  if (err || !members) { console.log('avatar updater had problems loading members'); }
  store.socratesOnlyMembers(function (err1, socMembers) {
    if (err1 || !members) { console.log('avatar updater had problems loading members'); }
    console.log('starting avatar update');
    async.each(_.union(members, socMembers), updateMembersAvatar, function (err2) {
      if (err2) {
        console.log('avatar updater encountered an error: ' + err2.message);
      }
      console.log('finishing avatar update');
      process.exit();
    });
  });
});
