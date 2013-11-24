"use strict";

var _ = require('underscore');
var moment = require('moment-timezone');

function Resource(resourceObject) {
  this.state = resourceObject; // this must be *the* object that is referenced by activity.resources[resourceName]
  return this;
}

Resource.prototype.registeredMembers = function () {
  if (!this.state) { return []; }

  if (!this.state._registeredMembers) {
    this.state._registeredMembers = [];
  }
  return _.pluck(this.state._registeredMembers, 'memberId');
};

Resource.prototype.addMemberId = function (memberId, momentOfRegistration) {
  if (!this.state) { return; }

  if (this.isFull()) { return; }

  if (this.registeredMembers().indexOf(memberId) === -1) {
    this.state._registeredMembers.push({
      memberId: memberId,
      registeredAt: (momentOfRegistration ? momentOfRegistration : new moment()).toDate()
    });
  }

  if (this.isFull()) { this.state._registrationOpen = false; }
};

Resource.prototype.removeMemberId = function (memberId) {
  if (!this.state) { return; }

  var index = this.registeredMembers().indexOf(memberId);
  if (index > -1) {
    this.state._registeredMembers.splice(index, 1);
  }
};

Resource.prototype.copyFrom = function (originalResource) {
  this.state._registeredMembers = [];
  this.state._limit = originalResource.state._limit;
  return this;
};

Resource.prototype.limit = function () {
  return this.state ? this.state._limit : undefined;
};

Resource.prototype.isFull = function () {
  return (this.limit() >= 0) && (this.limit() <= this.registeredMembers().length);
};

Resource.prototype.numberOfFreeSlots = function () {
  if (this.state && this.state._limit) {
    var freeSlots = this.state._limit - this.registeredMembers().length;
    return  (freeSlots < 0) ? 0 : freeSlots;
  }
  return "unbegrenzt";
};

Resource.prototype.registrationOpen = function () {
  return this.state._registrationOpen;
};

module.exports = Resource;
