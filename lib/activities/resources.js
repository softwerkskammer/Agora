"use strict";

var _ = require('underscore');

var beans = require('nconf').get('beans');
var Resource = beans.get('resource');


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
  var self = this;
  _.each(Object.getOwnPropertyNames(originalResources.state), function (key) {
    self.state[key] = new Resource({}).copyFrom(originalResources.named(key));
  });
  return this;
};

module.exports = Resources;
