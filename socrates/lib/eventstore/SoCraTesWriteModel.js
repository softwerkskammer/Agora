/*eslint no-underscore-dangle: 0*/
'use strict';



class SoCraTesWriteModel {
  constructor(eventStore) {
    this._eventStore = eventStore;
  }

  eventStore() {
    return this._eventStore;
  }
}

module.exports = SoCraTesWriteModel;
