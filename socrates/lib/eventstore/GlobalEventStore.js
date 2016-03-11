'use strict';

var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var socratesConstants = beans.get('socratesConstants');

function GlobalEventStore(object) {
  this.state = object || {
      url: socratesConstants.currentUrl,
      socratesEvents: [],
      registrationEvents: []
    };
}

GlobalEventStore.prototype.updateSoCraTesEvents = function (newEvents) {
  this.state.socratesEvents = this.state.socratesEvents.concat(newEvents);
};

GlobalEventStore.prototype.updateRegistrationEvents = function (newEvents) {
  this.state.registrationEvents = this.state.registrationEvents.concat(newEvents);
};

GlobalEventStore.prototype.socratesEvents = function () {
  return this.state.socratesEvents;
};

GlobalEventStore.prototype.registrationEvents = function () {
  return this.state.registrationEvents;
};

GlobalEventStore.prototype.setId = function () {
  if (!this.state.id) {
    // persistence needs an id:
    this.state.id = moment().valueOf() + this.state.url;
  }
};

module.exports = GlobalEventStore;
