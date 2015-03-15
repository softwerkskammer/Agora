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

function setDuration(record, duration) {
  record.duration = duration;
}

function SoCraTesResource(resource) {
  this.state = (resource && resource.state) || {};
  return this;
}

// inherit from Resource:
SoCraTesResource.prototype = new Resource();

SoCraTesResource.prototype.recordFor = function (memberId) {
  return _.find(this.state._registeredMembers, {'memberId': memberId});
};

SoCraTesResource.prototype.reserve = function (memberOrSessionId, registrationTuple) {
  if (!this.addMemberId(memberOrSessionId)) { return false; }
  var record = this.recordFor(memberOrSessionId)
  addExpirationTimeFor(record);
  setDuration(record, registrationTuple.duration);
  return true;
};

SoCraTesResource.prototype.stripExpiredReservations = function () {
  _.remove(this.state._registeredMembers, function (record) {
    return record.expiresAt && moment(record.expiresAt).isBefore(moment());
  });
};

module.exports = SoCraTesResource;
