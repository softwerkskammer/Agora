"use strict";
const logger = require("winston").loggers.get("application");

const Resource = require("./resource");

const standardName = "Veranstaltung";

// from now on we have the restriction that there can only be *ONE* resource named 'Veranstaltung' - this is
// an intermediate step towards removing the resources data structure completely

class Resources {
  constructor(state) {
    Object.getOwnPropertyNames(state).forEach((key) => {
      if (key !== standardName || !state[key]) {
        logger.info('activity with more than one resource not named "Veranstaltung" found');
        delete state[key];
      }
    });
    this.state = state; // this must be *the* object that is referenced by activity.resources
  }

  veranstaltung() {
    return new Resource(this.state[standardName], standardName);
  }

  copyFrom(originalResources) {
    this.state[standardName] = {};
    this.veranstaltung().copyFrom(originalResources.veranstaltung());
  }

  fillFromUI(resource) {
    this.veranstaltung().fillFromUI({
      limit: resource.limits,
      isRegistrationOpen: resource.isRegistrationOpen,
      hasWaitinglist: resource.hasWaitinglist,
      canUnsubscribe: resource.canUnsubscribe,
    });
  }

  allRegisteredMembers() {
    return this.veranstaltung().registeredMembers();
  }

  allWaitinglistEntries() {
    return this.veranstaltung().waitinglistEntries();
  }
}

module.exports = Resources;
