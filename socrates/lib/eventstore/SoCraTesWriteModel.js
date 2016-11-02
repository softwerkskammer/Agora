/*eslint no-underscore-dangle: 0*/
'use strict';



class SoCraTesWriteModel {
  constructor(eventStore) {
    this._eventStore = eventStore;
  }

  eventStore() {
    // persistence needs an id:
    this._eventStore.setId();
    return this._eventStore;
  }
}

module.exports = SoCraTesWriteModel;
