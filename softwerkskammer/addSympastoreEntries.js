/*eslint no-process-exit: 0 */
/* eslint no-console: 0 */
'use strict';

require('./configure'); // initializing parameters
const conf = require('simple-configure');
const beans = conf.get('beans');
const groupstore = beans.get('groupstore');
const listAdapter = beans.get('fakeListAdapter');
const async = require('async');

let really = process.argv[2];

if (!really || really !== 'really') {
  console.log('this script creates locally some entries in case you have imported groups from a production system');
  console.log('If you really want to migrate the lists, append "really" to the command line.');
  console.log('If you really want to save, append "doSave" after "really" to the command line.');
  process.exit();
}

function handle(err) {
  if (err) {
    console.log(err);
    process.exit();
  }
}

function listForGroup(group, callback) {
  listAdapter.createList(group.id, group.emailPrefix, callback);
}

groupstore.allGroups((err, groups) => {
  async.each(groups, listForGroup, err1 => { handle(err1); process.exit(); });
});



