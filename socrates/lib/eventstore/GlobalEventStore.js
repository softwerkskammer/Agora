'use strict';

var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var socratesConstants = beans.get('socratesConstants');

function GlobalEventStore(object) {
  this.state = object || {
      url: socratesConstants.currentUrl,
      socratesEvents: [],
      resourceEvents: []
    };
}

GlobalEventStore.prototype.updateSoCraTesEvents = function (newEvents) {
  this.state.socratesEvents = this.state.socratesEvents.concat(newEvents);
};

GlobalEventStore.prototype.socratesEvents = function () {
  return this.state.socratesEvents;
};

GlobalEventStore.prototype.setId = function () {
  if (!this.state.id) {
    // persistence needs an id:
    this.state.id = moment().valueOf() + this.state.url;
  }
};

module.exports = GlobalEventStore;
