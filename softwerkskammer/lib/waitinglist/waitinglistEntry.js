/* eslint no-underscore-dangle: 0 */

const { DateTime } = require("luxon");

class WaitinglistEntry {
  constructor(object) {
    this.state = object || {};
    this._resourceName = "Veranstaltung";
  }

  registrantId() {
    return this.state._memberId;
  }

  registrationDate() {
    return this.state._registeredAt
      ? DateTime.fromJSDate(this.state._registeredAt).toFormat("dd.MM.yyyy HH:mm")
      : undefined;
  }

  registrationValidUntil() {
    return this.state._registrationValidUntil
      ? DateTime.fromJSDate(this.state._registrationValidUntil).toFormat("dd.MM.yyyy HH:mm")
      : undefined;
  }

  setRegistrationValidityFor(hoursString) {
    if (hoursString) {
      const validHours = parseInt(hoursString, 10);
      this.state._registrationValidUntil = DateTime.local().plus({ hours: validHours }).toJSDate();
    } else {
      delete this.state._registrationValidUntil;
    }
  }

  canSubscribe() {
    if (!this.state._registrationValidUntil) {
      return false;
    }
    return DateTime.local() < this.state._registrationValidUntil;
  }

  // additional non-persistent information
  resourceName() {
    return this._resourceName;
  }
}

module.exports = WaitinglistEntry;
