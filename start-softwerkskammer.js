"use strict";

require("./softwerkskammer/configure"); // initializing parameters

const express = require("./softwerkskammer/app.js");
express.start();

process.on("SIGINT", () => {
  console.log("SHUTDOWN ON SIGINT (express)"); // eslint-disable-line no-console
  express.stop();
  process.exit(0); // eslint-disable-line no-process-exit
});
