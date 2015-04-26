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

function waitinglistRecordFor(state, memberId) {
  return _.find(state._waitinglist, {_memberId: memberId});
}

function recordOrWaitinglistRecordFor(state, registrationTuple) {
  var sessionID = 'SessionID:' + registrationTuple.sessionID;
  var record;
  if (registrationTuple.duration === 'waitinglist') {
    if (!state._waitinglist) {
      state._waitinglist = [];
    }
    record = waitinglistRecordFor(state, sessionID);
  } else {
    if (!state._registeredMembers) {
      state._registeredMembers = [];
    }
    record = _.find(state._registeredMembers, {memberId: sessionID});
  }
  return record;
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



SoCraTesResource.prototype.reserve = function (registrationTuple) {
  var sessionID = 'SessionID:' + registrationTuple.sessionID;
  if (registrationTuple.duration === 'waitinglist') {
    if (!this.addToWaitinglist(sessionID)) { return false; }
    addExpirationTimeFor(waitinglistRecordFor(this.state, sessionID));
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
    return self.addToWaitinglist(memberID);
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
  var record = recordOrWaitinglistRecordFor(this.state, registrationTuple);
  return !!(record && record.expiresAt && moment(record.expiresAt).isAfter(moment()));
};

SoCraTesResource.prototype.expirationTime = function (registrationTuple) {
  var record = recordOrWaitinglistRecordFor(this.state, registrationTuple);
  return record && moment(record.expiresAt);
};

module.exports = SoCraTesResource;
