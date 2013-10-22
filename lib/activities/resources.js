"use strict";

var _ = require('underscore');

var beans = require('nconf').get('beans');
var Resource = beans.get('resource');


function Resources(state) {
  this.state = state; // this must be *the* object that is contained in activity.resources
}

var cleanupResources = function (resources) {
  _.each(Object.getOwnPropertyNames(resources), function (key) {
    if (!resources[key]) {
      delete resources[key];
    }
  });
};

Resources.prototype.resourceNames = function () {
  cleanupResources(this.state); // TODO do this when actually building up the resources
  var keys = Object.getOwnPropertyNames(this.state);
  if (keys.length > 1) {
    return _.filter(keys, function (key) { return key !== 'default'; });
  }
  return keys;
};

Resources.prototype.get = function (resourceName) {
  cleanupResources(this.state);
  return new Resource(this.state[resourceName]);
};


Resources.prototype.registeredMembers = function (resource) {
  return this.get(resource || 'default').registeredMembers();
};

Resources.prototype.addMemberId = function (memberId, resource) {
  this.get(resource).addMemberId(memberId);
};

Resources.prototype.removeMemberId = function (memberId, resource) {
  this.get(resource).removeMemberId(memberId);
};

module.exports = Resources;
