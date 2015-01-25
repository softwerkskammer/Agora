'use strict';

function Addon(object) {
  this.state = object; // this must be *the* object that is referenced by subscriber.state._addon
  return this;
}

Addon.prototype.fillFromUI = function (uiInputObject) {
  this.state.homeAddress = uiInputObject.homeAddress;
  this.state.billingAddress = uiInputObject.billingAddress;
  this.state.tShirtSize = uiInputObject.tShirtSize;

  return this;
};

Addon.prototype.homeAddress = function () {
  return this.state.homeAddress;
};

Addon.prototype.homeAddressLines = function () {
  return this.state.homeAddress ? this.state.homeAddress.split('\n') : [];
};

Addon.prototype.billingAddress = function () {
  return this.state.billingAddress;
};

Addon.prototype.billingAddressLines = function () {
  return this.state.billingAddress ? this.state.billingAddress.split('\n') : [];
};

Addon.prototype.tShirtSize = function () {
  return this.state.tShirtSize;
};

module.exports = Addon;