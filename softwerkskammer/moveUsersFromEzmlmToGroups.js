/*eslint no-process-exit: 0 */
/* eslint no-console: 0 */
'use strict';

const async = require('async');

const conf = require('./configure'); // initializing parameters
const beans = require('simple-configure').get('beans');
const memberstore = beans.get('memberstore');
const groupstore = beans.get('groupstore');
//Just checking if remote has been configured
const listAdapter = conf.get('fullyQualifiedHomeDir') ? beans.get('ezmlmAdapter') : beans.get('fakeListAdapter');

const really = process.argv[2];
if (!really || really !== 'really') {
  console.log('This script migrates listusers to groups.');
  console.log('If you want to run this script, append "really" to the command line.');
  process.exit();
}

memberstore.allMembers((err, members) => {
  if (err) {
    console.log(err);
    process.exit();
  }

  function listsWithEmails(callback) {
    function createListUsersObject(list, cb) {
      listAdapter.getUsersOfList(list, (errX, users) => {
        cb(errX, {listname: list, users});
      });
    }

    listAdapter.getAllAvailableLists((errList, lists) => {
      if (errList) {
        console.log(errList);
        process.exit();
      }
      async.map(lists, createListUsersObject, (finalErr, results) => {
        if (finalErr) {
          console.log(finalErr);
          process.exit();
        }
        callback(finalErr, results);
      });
    });
  }

  listsWithEmails((err1, result) => {
    if (err1) {
      console.log(err1);
      process.exit();
    }

    result.forEach(r => console.log('list: ' + r.listname + ' users: ' + r.users.length));
    groupstore.allGroups((errGroups, groups) => {
      groups.forEach(g => {
        const currentList = result.find(r => r.listname === g.id);
        if (!currentList) {
          console.log('Liste für ' + g.id + ' nicht gefunden!');
          return;
        }
        g.subscribedMembers = members.filter(m => currentList.users.includes(m.email())).map(m => m.id());
        console.log('Group: ' + g.id + ', members: ' + g.subscribedMembers.join(','));
      });
      async.each(groups, groupstore.saveGroup, fatal => {
        if (fatal) {console.log('ERROR: ' + fatal);}
        process.exit();
      });
    });
  });
});
