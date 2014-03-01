"use strict";

function AddOnInfoOfMember(addOnInfoObject) {
  this.state = addOnInfoObject || {}; // this must be *the* object that is referenced by activity.addOnInfos[memberId]
  return this;
}


AddOnInfoOfMember.prototype.fillFromUI = function (uiInputObject) {
  this.state._home_address = uiInputObject.home_address;
  this.state._billing_address = uiInputObject.billing_address;
  this.state._t_shirt_size = uiInputObject.t_shirt_size;
  this.state._roommate = uiInputObject.roommate;

  return this;
};

AddOnInfoOfMember.prototype.homeAddress = function () {
  return this.state._home_address;
};

AddOnInfoOfMember.prototype.billingAddress = function () {
  return this.state._billing_address;
};
AddOnInfoOfMember.prototype.tShirtSize = function () {
  return this.state._t_shirt_size;
};
AddOnInfoOfMember.prototype.roommate = function () {
  return this.state._roommate;
};
