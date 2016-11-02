'use strict';

var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var socratesConstants = beans.get('socratesConstants');

class GlobalEventStore {
  constructor(object) {
    this.state = object || {
        url: socratesConstants.currentUrl,
        events: []
      };
    if (!this.state.id) {
      // persistence needs an id:
      this.state.id = this.state.url || socratesConstants.currentUrl;
    }
  }

  events() {
    return this.state.events;
  }

  updateEvents(newEvents) {
    this.state.events = this.state.events.concat(newEvents);
  }

  id() {
    return this.state.id;
  }
}

module.exports = GlobalEventStore;
