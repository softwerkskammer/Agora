"use strict";

var _ = require('underscore');

var beans = require('nconf').get('beans');
var misc = beans.get('misc');

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
  return Object.getOwnPropertyNames(this.state);
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

function matchArrayEntries(input) {
  return _.zip(misc.toArray(input.names), misc.toArray(input.limits), misc.toArray(input.previousNames), misc.toArray(input.registrationOpen));
}

Resources.prototype.fillFromUI = function (uiInputArrays) {
  var newResources = matchArrayEntries(uiInputArrays);
  var self = this;
  var newState = {};

  _.each(newResources, function (input) {

    var newName = input[0];
    var intLimit;
    if (input[1]) {
      intLimit = parseInt(input[1], 10);
    }
    var previousName = input[2];
    var registrationOpen = !!input[3];

    var resource;
    if (previousName) {
      // get the old resource
      resource = self.state[previousName];
    } else {
      // or create a new resource
      resource = {_registeredMembers: []};
    }
    if (resource) {
      // TODO: remove it! -- resource check is needed because we fill a blank Activity for validation

      // adjust the limit
      if (intLimit >= 0) {
        resource._limit = intLimit;
      } else {
        delete resource._limit;
      }

      // store registrationOpen in the new resource
      resource._registrationOpen = registrationOpen;
    }
    // store it under the new name
    if (newName) {
      newState[newName] = resource;
    }
  });

  // empty the old state
  _.each(self.resourceNames(), function (resourceName) {
    delete self.state[resourceName];
  });

  // transfer the contents of the new state
  _.each(Object.keys(newState), function (newResourceName) {
    self.state[newResourceName] = newState[newResourceName];
  });
};


Resources.prototype.allRegisteredMembers = function () {
  var allMembers = [];
  for (var key in this.state) {
    allMembers = allMembers.concat(this.named(key).registeredMembers());
  }
  return _.uniq(allMembers);
};

module.exports = Resources;
