/* eslint-disable */
"use strict";

// USED BY CRON
require("../../configure"); // initializing parameters

const store = require("./memberstore");
const service = require("./membersService");

async function run() {
  try {
    const members = store.allMembers();
    if (!members) {
      console.error("avatar updater had problems loading members"); // for cron mail
      process.exit(1);
    }
    await Promise.all(members.map(service.updateImage));
    process.exit();
  } catch (e) {
    console.error("avatar updater encountered an error: " + e.message); // for cron mail
    process.exit(1);
  }
}

run();
