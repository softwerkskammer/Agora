const transportOptions = require("simple-configure").get("transport-options");
if (transportOptions.debug === true) {
  transportOptions.logger = require("./nodemailer-logger").getLogger();
}
module.exports = require("nodemailer").createTransport(transportOptions);
