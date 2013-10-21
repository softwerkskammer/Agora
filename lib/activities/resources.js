"use strict";

var _ = require('underscore');


function Resources(state) {
  this.state = state; // this must be *the* object that is contained in activity.resources
}

var cleanupResources = function (keys, resources) {
  _.each(keys, function (key) {
    if (!resources[key]) {
      delete resources[key];
    }
  });
};

Resources.prototype.resourceNames = function () {
  var keys = Object.getOwnPropertyNames(this.state);
  cleanupResources(keys, this.state); // TODO do this when actually building up the resources
  keys = Object.getOwnPropertyNames(this.state);
  if (keys.length > 1) {
    keys = _.filter(keys, function (key) { return key !== 'default'; });
  }
  return keys;
};

Resources.prototype.get = function (resourceName) {
  return this.state[resourceName];
};

module.exports = Resources;
