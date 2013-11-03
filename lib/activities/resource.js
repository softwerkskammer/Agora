"use strict";

function Resource(resourceObject) {
  this.state = resourceObject; // this must be *the* object that is referenced by activity.resources[resourceName]
  return this;
}

Resource.prototype.registeredMembers = function () {
  if (!this.state) { return []; }

  if (!this.state._registeredMembers) {
    this.state._registeredMembers = [];
  }
  return this.state._registeredMembers;
};

Resource.prototype.addMemberId = function (memberId) {
  if (!this.state) { return; }

  if (this.isFull()) {
    return;
  }

  if (this.registeredMembers().indexOf(memberId) === -1) {
    this.registeredMembers().push(memberId);
  }
};

Resource.prototype.removeMemberId = function (memberId) {
  if (!this.state) { return; }

  if (!this.registeredMembers()) {
    return;
  }
  var index = this.registeredMembers().indexOf(memberId);
  if (index > -1) {
    this.registeredMembers().splice(index, 1);
  }
};

Resource.prototype.copyFrom = function (originalResource) {
  this.state._registeredMembers = [];
  this.state._limit = originalResource.state._limit;
  return this;
};

Resource.prototype.limit = function () {
  return !!(this.state) && !!(this.state._limit) ? this.state._limit : 0;
};

Resource.prototype.isFull = function () {
  return this.limit() > 0 && this.limit() >= this.registeredMembers().length;
};

Resource.prototype.numberOfFreeSlots = function () {
  if (this.state && this.state._limit) {
    var freeSlots = this.state._limit - this.registeredMembers().length;
    return  (freeSlots < 0) ? 0 : freeSlots;
  }
  return "unbegrenzt";
};

module.exports = Resource;
