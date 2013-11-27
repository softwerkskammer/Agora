"use strict";

var moment = require('moment-timezone');

function WaitinglistEntry(object) {
  if (object) {
    this.state = object;
  } else {
    this.state = {};
  }

  return this;
}

WaitinglistEntry.prototype.registrantId = function () {
  return this.state._registrantId;
};

WaitinglistEntry.prototype.activityUrl = function () {
  return this.state._activityName;
};

WaitinglistEntry.prototype.resourceName = function () {
  return this.state._resourceName;
};

WaitinglistEntry.prototype.registrationDate = function () {
  return this.state._registrationDate;
};

WaitinglistEntry.prototype.registrationValidUntil = function () {
  return this.state._registrationValidUntil;
};

WaitinglistEntry.prototype.setRegistrationValidityFor = function (hoursString) {
  if (hoursString) {
    var validHours = parseInt(hoursString, 10);
    this.state._registrationValidUntil = moment().add(validHours, 'hours').toDate();
  } else {
    delete this.state._registrationValidUntil;
  }
};


module.exports = WaitinglistEntry;


