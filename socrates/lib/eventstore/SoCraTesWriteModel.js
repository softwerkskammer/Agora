'use strict';



function SoCraTesWriteModel(eventStore) {
  this.eventStore = eventStore;
}

SoCraTesWriteModel.prototype.updateSoCraTesEvents = function (newEvents) {
  this.eventStore.updateSoCraTesEvents(newEvents);
};

SoCraTesWriteModel.prototype.eventStore = function () {
  // persistence needs an id:
  this.eventStore.setId();
  return this.eventStore;
};

module.exports = SoCraTesWriteModel;
