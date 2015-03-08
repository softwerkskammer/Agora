'use strict';

var _ = require('lodash');
var moment = require('moment-timezone');
var beans = require('simple-configure').get('beans');
var Resource = beans.get('resource');

function SoCraTesResource(resource) {
  this.state = (resource && resource.state) || {};
  return this;
}

// inherit from Resource:
SoCraTesResource.prototype = new Resource();


SoCraTesResource.prototype.addExpirationTimeFor = function (memberId) {
  var self = this;
  _.find(self.state._registeredMembers, {'memberId': memberId}).expiresAt = moment().add(30, 'minutes').toDate();
};

SoCraTesResource.single = 'single';

SoCraTesResource.prototype.displayName = function (resource) {
  if (resource === SoCraTesResource.single) {
    return 'Single-Bed Room';
  }
};

module.exports = SoCraTesResource;