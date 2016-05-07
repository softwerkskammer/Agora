'use strict';

var _ = require('lodash');

function Addon(object) {
  this.state = object; // this must be *the* object that is referenced by subscriber.state._addon
  return this;
}

Addon.prototype.fillFromUI = function (uiInputObject) {
  this.state.homeAddress = uiInputObject.homeAddress;
  this.state.billingAddress = uiInputObject.billingAddress;
  this.state.tShirtSize = _(uiInputObject.tShirtSize).compact().first();
  this.state.remarks = uiInputObject.remarks;
  return this;
};

Addon.prototype.remarks = function () {
  return this.state.remarks;
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

Addon.prototype.ladiesTShirt = function () {
  return this.state.tShirtSize.startsWith('Ladies');
};

Addon.hasAddonInformation = function (uiInputObject) {
  return !!uiInputObject.homeAddress;
};

module.exports = Addon;
