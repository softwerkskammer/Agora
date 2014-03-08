'use strict';

require('./configure'); // initializing parameters
var async = require('async');
var beans = require('nconf').get('beans');
var mailsPersistence = beans.get('mailsPersistence');
var groupsPersistence = beans.get('groupsPersistence');
var activitiesPersistence = beans.get('activitiesPersistence');

var really = process.argv[2];

if (!really || really !== 'really') {
  console.log('If you really want to rename the group, append "really" to the command line.');
  process.exit();
}

var oldId = "socrates2014";
var newId = "socrates2014orga";

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
  groupsPersistence.update(group, oldId, function (err) {
    handle(err);
    // change each activity that belongs to the group:
    activitiesPersistence.listByField({assignedGroup: oldId}, {}, function (err, results) {
      handle(err);
      async.each(results, function (each, callback) {
          each.assignedGroup = newId;
          activitiesPersistence.save(each, callback);
        },
        function (err) {
          handle(err);
          // change each archived email that belongs to the group:
          mailsPersistence.listByField({group: oldId}, {}, function (err, results) {
            async.each(results, function (each, callback) {
                each.group = newId;
                mailsPersistence.save(each, callback);
              },
              function (err) {
                handle(err);
                closeDBsAndExit();
              });
          });
        });
    });
  });
});

/*
 What else must be done when renaming a group?

 - rename the group in sympa (in the user interface)
 - rename the wiki directory (adapt all links??)

 */

