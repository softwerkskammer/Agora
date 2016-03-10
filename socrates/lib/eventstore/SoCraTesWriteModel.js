'use strict';



function SoCraTesWriteModel(eventStore) {
  this.eventStore = eventStore;
}

SoCraTesWriteModel.prototype.updateSoCraTesEvents = function (newEvents) {
  this.eventStore.updateSoCraTesEvents(newEvents);
};

module.exports = SoCraTesWriteModel;
