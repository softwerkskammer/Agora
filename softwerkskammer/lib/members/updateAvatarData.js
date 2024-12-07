/* eslint-disable */

"use strict";
require("../../configure"); // initializing parameters

require("simple-configure");
const store = require("./memberstore");
const service = require("./membersService");

async function run() {
  try {
    const members = store.allMembers();
    if (!members) {
      console.log("avatar updater had problems loading members"); // for cron mail
      process.exit(1);
    }
    await Promise.all(members.map(service.updateImage));
    process.exit();
  } catch (e) {
    console.log("avatar updater encountered an error: " + e.message); // for cron mail
    process.exit(1);
  }
}

run();
