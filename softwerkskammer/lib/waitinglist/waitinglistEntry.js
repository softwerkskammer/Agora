/* eslint no-underscore-dangle: 0 */
'use strict';

const moment = require('moment-timezone');

class WaitinglistEntry {
  constructor(object) {
    this.state = object || {};
    this._resourceName = 'Veranstaltung';
  }

  registrantId() {
    return this.state._memberId;
  }

  registrationDate() {
    return this.state._registeredAt ? moment(this.state._registeredAt).format('DD.MM.YYYY HH:mm') : undefined;
  }

  registrationValidUntil() {
    return this.state._registrationValidUntil ? moment(this.state._registrationValidUntil).format('DD.MM.YYYY HH:mm') : undefined;
  }

  setRegistrationValidityFor(hoursString) {
    if (hoursString) {
      const validHours = parseInt(hoursString, 10);
      this.state._registrationValidUntil = moment().add(validHours, 'hours').toDate();
    } else {
      delete this.state._registrationValidUntil;
    }
  }

  canSubscribe() {
    if (!this.state._registrationValidUntil) { return false; }
    const now = moment();
    const latestPossibilityToRegister = this.state._registrationValidUntil;
    return now.isBefore(latestPossibilityToRegister);
  }

  // additional non-persistent information
  resourceName() {
    return this._resourceName;
  }
}

module.exports = WaitinglistEntry;


