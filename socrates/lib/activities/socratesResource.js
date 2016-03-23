/*eslint no-underscore-dangle: 0*/
'use strict';

var _ = require('lodash');
var moment = require('moment-timezone');
var beans = require('simple-configure').get('beans');
var Resource = beans.get('resource');

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

SoCraTesResource.prototype.duration = function (memberId) {
  return this.recordFor(memberId).duration;
};

module.exports = SoCraTesResource;
