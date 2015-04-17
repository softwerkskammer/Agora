'use strict';

var _ = require('lodash');
var moment = require('moment-timezone');
var beans = require('simple-configure').get('beans');
var Resource = beans.get('resource');

function addExpirationTimeFor(record) {
  var date = moment();
  date.add(30, 'minutes');
  record.expiresAt = date.toDate();
}

function removeExpiredReservations(registeredMembers) {
  _.remove(registeredMembers, function (record) {
    return record.expiresAt && moment(record.expiresAt).isBefore(moment());
  });
}

function SoCraTesResource(resource) {
  this.state = (resource && resource.state) || {};
  this.resourceName = (resource && resource.resourceName);
  removeExpiredReservations(this.state._registeredMembers);
  removeExpiredReservations(this.state._waitinglist);
  return this;
}

// inherit from Resource:
SoCraTesResource.prototype = new Resource();

SoCraTesResource.prototype.recordFor = function (memberId) {
  return _.find(this.state._registeredMembers, {memberId: memberId});
};

SoCraTesResource.prototype.waitinglistRecordFor = function (memberId) {
  return _.find(this.state._waitinglist, {_memberId: memberId});
};

SoCraTesResource.prototype.reserve = function (registrationTuple) {
  var sessionID = 'SessionID:' + registrationTuple.sessionID;
  if (registrationTuple.duration === 'waitinglist') {
    this.addToWaitinglist(sessionID); // TODO return success status here?!
    addExpirationTimeFor(this.waitinglistRecordFor(sessionID));
  } else {
    if (!this.addMemberId(sessionID)) { return false; }
    var record = this.recordFor(sessionID);
    addExpirationTimeFor(record);
    record.duration = registrationTuple.duration;
  }
  return true;
};

SoCraTesResource.prototype.register = function (memberID, registrationTuple) {
  var sessionID = 'SessionID:' + registrationTuple.sessionID;

  function registerOnWaitinglist(self) {
    if (self.waitinglistEntryFor(sessionID)) {
      self.removeFromWaitinglist(sessionID);
    }
    self.addToWaitinglist(memberID); // TODO return success status here?!
    return true;
  }

  function registerOnResource(self) {
    var index = self.registeredMembers().indexOf(sessionID);
    if (index > -1) {
      self.state._registeredMembers.splice(index, 1);
    }

    if (!self.addMemberId(memberID)) { return false; }
    var record = self.recordFor(memberID);
    record.duration = registrationTuple.duration;
    return true;
  }

  if (registrationTuple.duration === 'waitinglist') {
    return registerOnWaitinglist(this);
  }
  return registerOnResource(this);
};

SoCraTesResource.prototype.hasValidReservationFor = function (registrationTuple) {
  var self = this;
  var sessionID = 'SessionID:' + registrationTuple.sessionID;
  if (!self.state._registeredMembers) {
    self.state._registeredMembers = [];
  }
  var record = self.recordFor(sessionID);
  return !!(record && record.expiresAt && moment(record.expiresAt).isAfter(moment()));
};

SoCraTesResource.prototype.hasValidWaitinglistReservationFor = function (registrationTuple) {
  if (!this.state._waitinglist) {
    this.state._waitinglist = [];
  }
  var sessionID = 'SessionID:' + registrationTuple.sessionID;
  var record = this.waitinglistRecordFor(sessionID);
  return record && record.expiresAt && moment(record.expiresAt).isAfter(moment());
};

module.exports = SoCraTesResource;
