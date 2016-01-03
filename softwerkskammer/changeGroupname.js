/*eslint no-process-exit: 0 */
/* eslint no-console: 0 */
'use strict';

require('./configure'); // initializing parameters
var async = require('async');
var beans = require('simple-configure').get('beans');
var mailsPersistence = beans.get('mailsPersistence');
var groupsPersistence = beans.get('groupsPersistence');
var activitiesPersistence = beans.get('activitiesPersistence');
var Git = beans.get('gitmech');

var really = process.argv[2];

if (!really || really !== 'really') {
  console.log('If you really want to rename the group, append "really" to the command line.');
  process.exit();
}

var oldId = 'socrates2014';
var newId = 'socrates-orga';
var newPrefix = 'SoCraTes Orga';

function closeDBsAndExit() {
  groupsPersistence.closeDB();
  activitiesPersistence.closeDB();
  mailsPersistence.closeDB();
  process.exit();
}

function handle(err) {
  if (err) {
    console.log(err);
    closeDBsAndExit();
  }
}

// change the group's id:
groupsPersistence.getById(oldId, function (err, group) {
  handle(err);
  group.id = newId;
  group.emailPrefix = newPrefix;
  groupsPersistence.update(group, oldId, function (err1) {
    handle(err1);
    // change each activity that belongs to the group:
    activitiesPersistence.listByField({assignedGroup: oldId}, {}, function (err2, results) {
      handle(err2);
      async.each(results,
        function (each, callback) {
          each.assignedGroup = newId;
          activitiesPersistence.save(each, callback);
        },
        function (err3) {
          handle(err3);
          // change each archived email that belongs to the group:
          mailsPersistence.listByField({group: oldId}, {}, function (err4, results1) {
            async.each(results1,
              function (each, callback) {
                each.group = newId;
                mailsPersistence.save(each, callback);
              },
              function (err5) {
                handle(err5);
                Git.mv(oldId, newId, 'Group rename: ' + oldId + ' -> ' + newId, 'Nicole <Nicole@softwerkskammer.org>', function (err6) {
                  handle(err6);
                  closeDBsAndExit();
                });
              });
          });
        });
    });
  });
});

/*
 What else must be done when renaming a group?

 - rename the group in sympa:
 - Rename List
 - Edit List Config -> List Definition -> Subject of the list
 - Edit List Config -> Sending/Receiving Setup -> Subject tagging (custom_subject)
 - adapt all wiki-links??

 */

