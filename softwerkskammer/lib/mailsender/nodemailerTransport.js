"use strict";
const conf = require("simple-configure");
const TESTMODE = conf.get("TESTMODE");
const transportOptions = conf.get("transport-options");
if (transportOptions?.debug) {
  transportOptions.logger = require("./nodemailer-logger").getLogger();
}
module.exports = TESTMODE
  ? {
      sendMail: function () {
        throw new Error("Nodemailer Transport for tests - function sendMail not implemented");
      },
    }
  : require("nodemailer").createTransport(transportOptions);
