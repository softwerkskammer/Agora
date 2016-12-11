'use strict';

const beans = require('simple-configure').get('beans');
const misc = beans.get('misc');

class Addon {
  constructor(object) {
    this.state = object; // this must be *the* object that is referenced by subscriber.state._addon
  }

  fillFromUI(uiInputObject) {
    this.state.homeAddress = uiInputObject.homeAddress;
    this.state.billingAddress = uiInputObject.billingAddress;
    this.state.tShirtSize = misc.compact(uiInputObject.tShirtSize)[0];
    this.state.remarks = uiInputObject.remarks;
    return this;
  }

  remarks() {
    return this.state.remarks;
  }

  homeAddress() {
    return this.state.homeAddress;
  }

  homeAddressLines() {
    return this.state.homeAddress ? this.state.homeAddress.split('\n') : [];
  }

  billingAddress() {
    return this.state.billingAddress;
  }

  billingAddressLines() {
    return this.state.billingAddress ? this.state.billingAddress.split('\n') : [];
  }

  tShirtSize() {
    return this.state.tShirtSize;
  }

  ladiesTShirt() {
    return this.state.tShirtSize.startsWith('Ladies');
  }

  static hasAddonInformation(uiInputObject) {
    return !!uiInputObject.homeAddress;
  }
}

module.exports = Addon;
