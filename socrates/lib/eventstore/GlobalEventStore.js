'use strict';

var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var socratesConstants = beans.get('socratesConstants');

function GlobalEventStore(object) {
  this.state = object || {
      url: socratesConstants.currentUrl,
      socratesEvents: [],
      registrationEvents: [],
      roomsEvents: []
    };
}

GlobalEventStore.prototype.socratesEvents = function () {
  return this.state.socratesEvents;
};

GlobalEventStore.prototype.updateSoCraTesEvents = function (newEvents) {
  this.state.socratesEvents = this.state.socratesEvents.concat(newEvents);
};

GlobalEventStore.prototype.registrationEvents = function () {
  return this.state.registrationEvents;
};

GlobalEventStore.prototype.updateRegistrationEvents = function (newEvents) {
  this.state.registrationEvents = this.state.registrationEvents.concat(newEvents);
};

GlobalEventStore.prototype.roomsEvents = function () {
  return this.state.roomsEvents;
};

GlobalEventStore.prototype.updateRoomsEvents = function (newEvents) {
  this.state.roomsEvents = this.state.roomsEvents.concat(newEvents);
};

// TODO why can't the id be just the URL? Why can't we simply use the id === url to find the eventstore? And remove the state.url?
GlobalEventStore.prototype.setId = function () {
  if (!this.state.id) {
    // persistence needs an id:
    this.state.id = moment().valueOf() + '-' + this.state.url;
  }
};

GlobalEventStore.prototype.id = function () {
  return this.state.id;
};

module.exports = GlobalEventStore;
