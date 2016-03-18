/*eslint no-underscore-dangle: 0*/
'use strict';

var _ = require('lodash');
var moment = require('moment-timezone');
var beans = require('simple-configure').get('beans');
var Resource = beans.get('resource');
var roomOptions = beans.get('roomOptions');

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

SoCraTesResource.prototype.addWaitinglistRecord = function (record) {
  if (!this.state._waitinglist) {
    return; // waitinglist is not enabled
  }
  this.state._waitinglist.push(record);
};

SoCraTesResource.prototype.durationFor = function (memberId) {
  return roomOptions.endOfStayFor(this.recordFor(memberId).duration);
};

SoCraTesResource.prototype.duration = function (memberId) {
  return this.recordFor(memberId).duration;
};

SoCraTesResource.prototype.durations = function () {
  if (!this.state._registeredMembers) {
    this.state._registeredMembers = [];
  }
  return _.pluck(this.state._registeredMembers, 'duration');
};

module.exports = SoCraTesResource;
