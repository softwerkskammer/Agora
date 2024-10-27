"use strict";
const conf = require("simple-configure");
const beans = conf.get("beans");
const Activity = beans.get("activity");

class SoCraTesActivity extends Activity {
  fullyQualifiedUrl() {
    return conf.get("socratesURL");
  }

  assignedGroup() {
    return "G"; // this must not return undefined for SoCraTes to work
  }

  groupName() {
    return undefined;
  }

  colorFrom() {
    return "#3771C8";
  }

  groupFrom() {
    return undefined;
  }

  description() {
    return ""; // required for ical export
  }
}

module.exports = SoCraTesActivity;
