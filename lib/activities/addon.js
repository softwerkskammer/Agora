"use strict";

var beans = require('nconf').get('beans');
var Renderer = beans.get('renderer');

function Addon(object) {
  this.state = object || {}; // this must be *the* object that is referenced by activity.addOnInfos[memberId]
  return this;
}

Addon.prototype.fillFromUI = function (uiInputObject) {
  this.state.homeAddress = uiInputObject.homeAddress;
  this.state.billingAddress = uiInputObject.billingAddress;
  this.state.tShirtSize = uiInputObject.tShirtSize;
  this.state.roommate = uiInputObject.roommate;
  if (!!uiInputObject.moneyTransferred) {
    this.state.moneyTransferred = uiInputObject.moneyTransferred;
  }
  if (!!uiInputObject.creditCardPaid) {
    this.state.creditCardPaid = uiInputObject.creditCardPaid;
  }

  return this;
};

Addon.prototype.homeAddress = function () {
  return this.state.homeAddress;
};

Addon.prototype.billingAddress = function () {
  return this.state.billingAddress;
};

Addon.prototype.tShirtSize = function () {
  return this.state.tShirtSize;
};

Addon.prototype.roommate = function () {
  return this.state.roommate;
};

Addon.prototype.moneyTransferred = function () {
  return this.state.moneyTransferred;
};

Addon.prototype.creditCardPaid = function () {
  return this.state.creditCardPaid;
};

function AddonConfig(object) {
  this.state = object || {}; // this must be *the* object that is referenced by activity.addOnInfos[memberId]
  return this;
}

AddonConfig.prototype.homeAddress = function () {
  return this.state.homeAddress;
};

AddonConfig.prototype.billingAddress = function () {
  return this.state.billingAddress;
};

AddonConfig.prototype.tShirtSize = function () {
  return this.state.tShirtSize;
};

AddonConfig.prototype.roommate = function () {
  return this.state.roommate;
};

AddonConfig.prototype.addonInformation = function () {
  return this.state.addonInformation || '';
};

AddonConfig.prototype.addonInformationHTML = function () {
  return Renderer.render(this.addonInformation());
};

AddonConfig.prototype.deposit = function () {
  return this.state.deposit;
};

module.exports.Addon = Addon;
module.exports.AddonConfig = AddonConfig;
