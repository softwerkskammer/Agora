"use strict";

var beans = require('nconf').get('beans');
var misc = beans.get('misc');

function Resource(registeredMembers, limit) {
  this._registeredMembers = misc.toArray(registeredMembers);
  this._limit = limit;
  return this;
}

Resource.prototype.registeredMembers = function () {
  return this._registeredMembers;
};

Resource.prototype.addMemberId = function (memberId) {
  if (this.isFull()) {
    return;
  }

  if (!this.registeredMembers()) {
    this._registeredMembers = [];
  }
  if (this.registeredMembers().indexOf(memberId) === -1) {
    this._registeredMembers.push(memberId);
  }
};

Resource.prototype.removeMemberId = function (memberId) {
  if (this.registeredMembers() === undefined) {
    return;
  }
  var index = this.registeredMembers().indexOf(memberId);
  if (index > -1) {
    this.registeredMembers().splice(index, 1);
  }
};

Resource.prototype.isFull = function () {
  if (this._limit) {
    return this._limit === this._registeredMembers.length;
  }
  return false;
};

module.exports = Resource;
