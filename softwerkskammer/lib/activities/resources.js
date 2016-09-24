'use strict';

const beans = require('simple-configure').get('beans');
const logger = require('winston').loggers.get('application');

const Resource = beans.get('resource');

const standardName = 'Veranstaltung';

// from now on we have the restriction that there can only be *ONE* resource named 'Veranstaltung' - this is
// an intermediate step towards removing the resources data structure completely

function removeInvalidResources(state) {
  Object.getOwnPropertyNames(state).forEach( key => {
    if (key !== standardName || !state[key]) {
      logger.info('activity with more than one resource not named "Veranstaltung" found');
      delete state[key];
    }
  });
}

function Resources(state) {
  this.state = state; // this must be *the* object that is referenced by activity.resources
  removeInvalidResources(this.state);
}

Resources.prototype.named = function () {
  return this.veranstaltung();
};

Resources.prototype.veranstaltung = function() {
  return new Resource(this.state[standardName], standardName);
};

Resources.prototype.copyFrom = function (originalResources) {
  this.state[standardName] = {};
  this.veranstaltung().copyFrom(originalResources.veranstaltung());
};

Resources.prototype.fillFromUI = function (resource) {
  this.veranstaltung().fillFromUI({
    limit: resource.limits,
    isRegistrationOpen: resource.isRegistrationOpen,
    hasWaitinglist: resource.hasWaitinglist,
    canUnsubscribe: resource.canUnsubscribe
  });
};

Resources.prototype.allRegisteredMembers = function () {
  return this.veranstaltung().registeredMembers();
};

Resources.prototype.allWaitinglistEntries = function () {
  return this.veranstaltung().waitinglistEntries();
};

module.exports = Resources;
