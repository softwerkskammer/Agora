"use strict";

function Addon(addon) {
  this.state = addon || {}; // this must be *the* object that is referenced by activity.addOnInfos[memberId]
  return this;
}


Addon.prototype.fillFromUI = function (uiInputObject) {
  this.state._home_address = uiInputObject.homeAddress;
  this.state._billing_address = uiInputObject.billingAddress;
  this.state._t_shirt_size = uiInputObject.tShirtSize;
  this.state._roommate = uiInputObject.roommate;

  return this;
};

Addon.prototype.homeAddress = function () {
  return this.state._home_address;
};

Addon.prototype.billingAddress = function () {
  return this.state._billing_address;
};
Addon.prototype.tShirtSize = function () {
  return this.state._t_shirt_size;
};
Addon.prototype.roommate = function () {
  return this.state._roommate;
};

module.exports = Addon;
