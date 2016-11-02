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
  }

  events() {
    return this.state.events;
  }

  updateEvents(newEvents) {
    this.state.events = this.state.events.concat(newEvents);
  }

  // TODO why can't the id be just the URL? Why can't we simply use the id === url to find the eventstore? And remove the state.url?
  setId() {
    if (!this.state.id) {
      // persistence needs an id:
      this.state.id = moment().valueOf() + '-' + this.state.url;
    }
  }

  id() {
    return this.state.id;
  }
}


module.exports = GlobalEventStore;
