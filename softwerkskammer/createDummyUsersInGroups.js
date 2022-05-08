/*eslint no-process-exit: 0 */
/* eslint no-console: 0 */
"use strict";

const async = require("async");

require("./configure"); // initializing parameters
const beans = require("simple-configure").get("beans");
const memberstore = beans.get("memberstore");
const groupstore = beans.get("groupstore");

const really = process.argv[2];
if (!really || really !== "really") {
  console.log("This script randomly adds members to groups. OVERRIDES previously attached members");
  console.log('If you want to run this script, append "really" to the command line.');
  process.exit();
}

memberstore.allMembers(async (err, members) => {
  if (err) {
    console.log(err);
    process.exit();
  }
  const ids = members.map((m) => m.id());

  async function addIdsToGroupAndSave(group, cb) {
    // eslint-disable-next-line no-unused-vars
    group.subscribedMembers = ids.filter((e) => Math.random() < 0.5);
    console.log("saving " + group.subscribedMembers.length + " users in group " + group.id);
    return groupstore.saveGroup(group, cb);
  }

  try {
    const groups = await groupstore.allGroups();
    if (!groups) {
      console.log("ERROR ON LOADING ALL GROUPS: no of groups: " + groups ? groups.length : "no groups");
      process.exit();
    }
    async.each(groups, async.asyncify(addIdsToGroupAndSave), (fatal) => {
      if (fatal) {
        console.log("ERROR: " + fatal);
      }
      process.exit();
    });
  } catch (e) {
    console.log("ERROR ON LOADING ALL GROUPS: " + e);
    process.exit();
  }

  memberstore.list({ id: 1 }, (err1, lists) => {
    if (err1) {
      console.log(err1);
      process.exit();
    }
    async.each(lists, addIdsToGroupAndSave, (finalErr) => {
      if (finalErr) {
        console.log(finalErr);
        process.exit();
      }
    });
  });
});
