/* eslint no-underscore-dangle: 0 */
'use strict';

var moment = require('moment-timezone');

function WaitinglistEntry(object) {
  if (object) {
    this.state = object;
  } else {
    this.state = {};
  }
  this._resourceName = 'Veranstaltung';
  return this;
}

WaitinglistEntry.prototype.registrantId = function () {
  return this.state._memberId;
};

WaitinglistEntry.prototype.registrationDate = function () {
  return this.state._registeredAt ? moment(this.state._registeredAt).format('DD.MM.YYYY HH:mm') : undefined;
};

WaitinglistEntry.prototype.registrationValidUntil = function () {
  return this.state._registrationValidUntil ? moment(this.state._registrationValidUntil).format('DD.MM.YYYY HH:mm') : undefined;
};

WaitinglistEntry.prototype.setRegistrationValidityFor = function (hoursString) {
  if (hoursString) {
    var validHours = parseInt(hoursString, 10);
    this.state._registrationValidUntil = moment().add(validHours, 'hours').toDate();
  } else {
    delete this.state._registrationValidUntil;
  }
};

WaitinglistEntry.prototype.canSubscribe = function () {
  if (!this.state._registrationValidUntil) { return false; }
  var now = moment();
  var latestPossibilityToRegister = this.state._registrationValidUntil;
  return now.isBefore(latestPossibilityToRegister);
};

// additional non-persistent information
WaitinglistEntry.prototype.resourceName = function () {
  return this._resourceName;
};

module.exports = WaitinglistEntry;


