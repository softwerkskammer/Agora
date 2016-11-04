/*eslint no-underscore-dangle: 0*/
'use strict';



class SoCraTesWriteModel {
  constructor(eventStore) {
    this._url = eventStore.state.url;
  }

  url() {
    return this._url;
  }
}

module.exports = SoCraTesWriteModel;
