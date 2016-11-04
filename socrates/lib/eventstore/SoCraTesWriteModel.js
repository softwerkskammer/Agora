/*eslint no-underscore-dangle: 0*/
'use strict';



class SoCraTesWriteModel {
  constructor(url) {
    this._url = url;
  }

  url() {
    return this._url;
  }
}

module.exports = SoCraTesWriteModel;
