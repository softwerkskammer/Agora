"use strict";
var globallocals = require('./global-locals');

module.exports = {
  t: globallocals.t,
  addonConfig: {
    addonInformation: function () { return "addonInformation"; },
    addonInformationHTML: function () { return "addonInformationHTML"; },
    homeAddress: function () { return "yes"; },
    billingAddress: function () { return "yes"; },
    tShirtSize: function () { return "yes"; },
    roommate: function () { return "yes"; },
    deposit: function () { return ""; }
  },
  addon: {
    homeAddress: function () { return ""; },
    billingAddress: function () { return ""; },
    tShirtSize: function () { return ""; },
    roommate: function () { return ""; }
  }
};
