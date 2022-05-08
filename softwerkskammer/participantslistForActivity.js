/*eslint no-process-exit: 0 */
/* eslint no-console: 0 */
"use strict";

require("./../softwerkskammer/configure"); // initializing parameters
const beans = require("simple-configure").get("beans");
const activitiesService = beans.get("activitiesService");

const url = process.argv[2];
if (!url) {
  console.log("If you want to run this script, append the url (last part) of the activity to the command line.");
  process.exit();
}

activitiesService.getActivityWithGroupAndParticipants(url, (err, activity) => {
  if (err) {
    console.log(err);
    process.exit();
  }
  activity.participants.forEach((member) => {
    console.log(member.firstname() + ";" + member.lastname() + ";" + member.email());
  });
  process.exit();
});
