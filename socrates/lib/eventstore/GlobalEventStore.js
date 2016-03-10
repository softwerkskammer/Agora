'use strict';

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

module.exports = GlobalEventStore;
