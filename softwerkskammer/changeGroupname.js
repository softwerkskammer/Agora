/* eslint no-process-exit: 0 */
/* eslint no-console: 0 */
"use strict";

require("./configure"); // initializing parameters
const async = require("async");
const beans = require("simple-configure").get("beans");
const mailsPersistence = beans.get("mailsPersistence");
const groupsPersistence = beans.get("groupsPersistence");
const groupsAndMembers = beans.get("groupsAndMembersService");
const groupsService = beans.get("groupsService");
const activitiesPersistence = beans.get("activitiesPersistence");
const Git = beans.get("gitmech");

const really = process.argv[2];

const oldId = "dortmund";
const newId = "ruhrgebiet";

console.log('This script assumes that you want to "rename" a group. This is done by creating a new mailinglist.');
console.log("Before running this script, you need to create the target group manually as a new group inside Agora.");
if (!really || really !== "really") {
  console.log('If you really want to move the group\'s references and members, append "really" to the command line.');
  process.exit();
}

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
groupsAndMembers.getGroupAndMembersForList(oldId, (err, group) => {
  handle(err);
  async.each(
    group.members,
    (member, callback) => {
      groupsService.addMemberToGroupNamed(member, newId, callback);
    },
    (err1) => {
      handle(err1);

      // change each activity that belongs to the group:
      activitiesPersistence.listByField({ assignedGroup: oldId }, {}, (err2, results) => {
        handle(err2);
        async.each(
          results,
          (each, callback) => {
            each.assignedGroup = newId;
            activitiesPersistence.save(each, callback);
          },
          (err3) => {
            handle(err3);
            // change each archived email that belongs to the group:
            mailsPersistence.listByField({ group: oldId }, {}, (err4, results1) => {
              async.each(
                results1,
                (each, callback) => {
                  each.group = newId;
                  mailsPersistence.save(each, callback);
                },
                (err5) => {
                  handle(err5);
                  Git.mv(
                    oldId,
                    newId,
                    "Group rename: " + oldId + " -> " + newId,
                    "Nicole <Nicole@softwerkskammer.org>",
                    (err6) => {
                      handle(err6);
                      closeDBsAndExit();
                    }
                  );
                }
              );
            });
          }
        );
      });
    }
  );
});

/*
 What else must be done when renaming a group?

 - rename the group in sympa:
 - Rename List
 - Edit List Config -> List Definition -> Subject of the list
 - Edit List Config -> Sending/Receiving Setup -> Subject tagging (custom_subject)
 - adapt all wiki-links??

 */
