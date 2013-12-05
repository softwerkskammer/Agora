"use strict";

var _ = require('underscore');
var moment = require('moment-timezone');
var WaitinglistEntry = require('nconf').get('beans').get('waitinglistEntry');

function Resource(resourceObject, resourceName) {
  this.resourceName = resourceName;
  this.state = resourceObject || {}; // this must be *the* object that is referenced by activity.resources[resourceName]
  return this;
}

Resource.prototype.fillFromUI = function (uiInputObject) {
  this.state._registrationOpen = !!uiInputObject.isRegistrationOpen;
  if (uiInputObject.hasWaitinglist) {
    this.state._waitinglist = this.state._waitinglist || [];
  } else {
    delete this.state._waitinglist;
  }

  // adjust the limit
  var intLimit = parseInt(uiInputObject.limit, 10);
  if (intLimit >= 0) {
    this.state._limit = intLimit;
  } else {
    delete this.state._limit;
  }
  return this;
};

Resource.prototype.registeredMembers = function () {
  if (!this.state._registeredMembers) {
    this.state._registeredMembers = [];
  }
  return _.pluck(this.state._registeredMembers, 'memberId');
};

Resource.prototype.addMemberId = function (memberId, momentOfRegistration) {
  if (this.isFull()) { return; }

  if (this.registeredMembers().indexOf(memberId) === -1) {
    this.state._registeredMembers.push({
      memberId: memberId,
      registeredAt: (momentOfRegistration ? momentOfRegistration : new moment()).toDate()
    });
  }

  if (this.isFull()) { this.state._registrationOpen = false; }
};

Resource.prototype.addToWaitinglist = function (memberId, momentOfRegistration) {
  if (!this.hasWaitinglist()) { return; }
  if (!this.waitinglistEntryFor(memberId)) {
    this.state._waitinglist.push({
      _memberId: memberId,
      _registeredAt: (momentOfRegistration ? momentOfRegistration : new moment()).toDate()
    });
  }
};

Resource.prototype.waitinglistEntries = function () {
  if (!this.hasWaitinglist()) {
    return [];
  }
  return _.map(this.state._waitinglist, function (waitinglistEntry) {
    return new WaitinglistEntry(waitinglistEntry);
  });
};

Resource.prototype.waitinglistEntryFor = function (memberId) {
  if (!this.hasWaitinglist()) { return undefined; }
  var entry = _.find(this.state._waitinglist, function (waitinglistEntry) {
    return waitinglistEntry._memberId === memberId;
  });
  if (entry) {
    entry = new WaitinglistEntry(entry);
    entry._resourceName = this.resourceName;
  }
  return entry;
};

Resource.prototype.removeMemberId = function (memberId) {
  var index = this.registeredMembers().indexOf(memberId);
  if (index > -1) {
    this.state._registeredMembers.splice(index, 1);
  }
};

Resource.prototype.copyFrom = function (originalResource) {
  this.state._registeredMembers = [];
  this.state._limit = originalResource.limit();
  this.state._registrationOpen = true;
  return this;
};

Resource.prototype.limit = function () {
  return this.state._limit;
};

Resource.prototype.isFull = function () {
  return (this.limit() >= 0) && (this.limit() <= this.registeredMembers().length);
};

Resource.prototype.numberOfFreeSlots = function () {
  if (this.limit() >= 0) {
    return Math.max(0, this.limit() - this.registeredMembers().length);
  }
  return "unbegrenzt";
};

Resource.prototype.isRegistrationOpen = function () {
  return this.state._registrationOpen;
};

Resource.prototype.hasWaitinglist = function () {
  return !!this.state._waitinglist;
};

module.exports = Resource;
