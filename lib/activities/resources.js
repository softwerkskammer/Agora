"use strict";

var _ = require('underscore');

var beans = require('nconf').get('beans');
var Resource = beans.get('resource');

//var util = require('util');

var removeInvalidResources = function (state) {
  _.each(Object.getOwnPropertyNames(state), function (key) {
    if (!state[key]) {
      delete state[key];
    }
  });
};

function Resources(state) {
  this.state = state; // this must be *the* object that is referenced by activity.resources
  removeInvalidResources(this.state);
}

Resources.prototype.resourceNames = function () {
  var keys = Object.getOwnPropertyNames(this.state);
  if (keys.length > 1) {
    return _.filter(keys, function (key) { return key !== 'default'; });
  }
  return keys;
};

Resources.prototype.named = function (resourceName) {
  return new Resource(this.state[resourceName]);
};

Resources.prototype.copyFrom = function (originalResources) {
  for (var key in originalResources.state) {
    this.state[key] = {};
    this.named(key).copyFrom(originalResources.named(key));
  }
  return this;
};

Resources.prototype.allRegisteredMembers = function () {

};

module.exports = Resources;
