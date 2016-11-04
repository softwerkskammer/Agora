/*eslint no-underscore-dangle: 0*/
'use strict';



class SoCraTesWriteModel {
  constructor(eventStore) {
    this._eventStore = eventStore;
    this._url = eventStore.state.url;
  }

  eventStore() {
    return this._eventStore;
  }

  url() {
    return this._url;
  }
}

module.exports = SoCraTesWriteModel;
