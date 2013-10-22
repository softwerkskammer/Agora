"use strict";

var _ = require('underscore');

var beans = require('nconf').get('beans');
var Resource = beans.get('resource');


var removeInvalidResources = function (resources) {
  _.each(Object.getOwnPropertyNames(resources), function (key) {
    if (!resources[key]) {
      delete resources[key];
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

module.exports = Resources;
