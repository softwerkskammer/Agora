'use strict';

const WaitinglistEntry = require('simple-configure').get('beans').get('waitinglistEntry');

class Resource {
  constructor(resourceObject) {
    this.resourceName = 'Veranstaltung';
    this.state = resourceObject || {}; // this must be *the* object that is referenced by activity.resources.Veranstaltung
  }

  fillFromUI(uiInputObject) {
    /* eslint no-underscore-dangle: 0 */

    this.state._registrationOpen = uiInputObject.isRegistrationOpen === 'yes';
    this.state._canUnsubscribe = uiInputObject.canUnsubscribe === 'yes';
    this.state._position = uiInputObject.position;

    if (uiInputObject.hasWaitinglist === 'yes') {
      this.state._waitinglist = this.state._waitinglist || [];
    } else {
      delete this.state._waitinglist;
    }

    // adjust the limit
    const intLimit = parseInt(uiInputObject.limit, 10);
    if (intLimit >= 0) {
      this.state._limit = intLimit;
    } else {
      delete this.state._limit;
    }

    return this;
  }

  registeredMembers() {
    if (!this.state._registeredMembers) {
      this.state._registeredMembers = [];
    }
    return this.state._registeredMembers.map(each => each.memberId);
  }

  registrationDateOf(memberId) {
    if (!this.state._registeredMembers) {
      this.state._registeredMembers = [];
    }
    const registration = this.state._registeredMembers.find(each => each.memberId === memberId);
    return registration ? new Date(registration.registeredAt) : undefined;
  }

  addMemberId(memberId, millisOfRegistration) {
    if (this.canSubscribe() || this.canSubscribeFromWaitinglist(memberId)) {
      if (this.registeredMembers().indexOf(memberId) === -1) {
        this.state._registeredMembers.push({
          memberId,
          registeredAt: millisOfRegistration ? new Date(millisOfRegistration) : new Date()
        });
      }
      this.removeFromWaitinglist(memberId);
      if (this.isFull()) { this.state._registrationOpen = false; }
      return true;
    }
    return false;
  }

  isAlreadyRegistered(memberId) {
    return this.registeredMembers().indexOf(memberId) > -1;
  }

  removeMemberId(memberId) {
    if (this.canUnsubscribe()) {
      const index = this.registeredMembers().indexOf(memberId);
      if (index > -1) {
        this.state._registeredMembers.splice(index, 1);
      }
    }
  }

  addToWaitinglist(memberId, millisOfRegistration) {
    if (!this.hasWaitinglist()) { return false; }
    if (this.isAlreadyRegistered(memberId)) { return false; }
    if (!this.waitinglistEntryFor(memberId)) {
      this.state._waitinglist.push({
        _memberId: memberId,
        _registeredAt: millisOfRegistration ? new Date(millisOfRegistration) : new Date()
      });
    }
    return true;
  }

  removeFromWaitinglist(memberId) {
    if (!this.hasWaitinglist()) { return; }
    const index = this.state._waitinglist.findIndex(each => each._memberId === memberId);
    if (index > -1) {
      this.state._waitinglist.splice(index, 1);
    }
  }

  waitinglistEntries() {
    if (!this.hasWaitinglist()) { return []; }
    return this.state._waitinglist.map(waitinglistEntry => new WaitinglistEntry(waitinglistEntry));
  }

  waitinglistEntryFor(memberId) {
    if (!this.hasWaitinglist()) { return undefined; }
    const entry = this.state._waitinglist.find(waitinglistEntry => waitinglistEntry._memberId === memberId);
    return entry ? new WaitinglistEntry(entry) : undefined;
  }

  copyFrom(originalResource) {
    this.state._registeredMembers = [];
    this.state._limit = originalResource.limit();
    this.state._registrationOpen = true;
    return this;
  }

  limit() {
    return this.state._limit;
  }

  isFull() {
    return (this.limit() >= 0) && (this.limit() <= this.registeredMembers().length);
  }

  canSubscribe() {
    return this.isRegistrationOpen() && !this.isFull();
  }

  canSubscribeFromWaitinglist(memberId) {
    const waitingListEntry = this.waitinglistEntryFor(memberId);
    return waitingListEntry && waitingListEntry.canSubscribe();
  }

  numberOfFreeSlots() {
    if (this.limit() >= 0) {
      return Math.max(0, this.limit() - this.registeredMembers().length);
    }
    return 'unbegrenzt';
  }

  isRegistrationOpen() {
    return this.state._registrationOpen;
  }

  canUnsubscribe() {
    return (this.state._canUnsubscribe === undefined) || this.state._canUnsubscribe;
  }

  hasWaitinglist() {
    return !!this.state._waitinglist;
  }

  registrationStateFor(memberId) {
    if (this.isAlreadyRegistered(memberId)) {
      return this.canUnsubscribe() ? Resource.registered : Resource.fixed;
    }
    if (this.canSubscribeFromWaitinglist(memberId)) {
      return Resource.canSubscribeFromWaitinglist;
    }
    if (this.canSubscribe()) {
      return Resource.registrationPossible;
    }
    if (this.limit() === 0) {
      return Resource.registrationElsewhere;
    }
    if ((!this.isRegistrationOpen() && !this.limit()) || (this.limit() && this.registeredMembers().length === 0)) {
      return Resource.registrationClosed;
    }
    if (this.hasWaitinglist() && this.waitinglistEntryFor(memberId)) {
      return Resource.onWaitinglist;
    }
    if (this.hasWaitinglist()) {
      return Resource.waitinglistPossible;
    }
    return Resource.full;
  }
}

// registration states

Resource.fixed = 'fixed'; // registered and locked (no unsubscribe possible)
Resource.registered = 'registered';
Resource.registrationPossible = 'registrationPossible';
Resource.registrationElsewhere = 'registrationElsewhere';
Resource.registrationClosed = 'registrationClosed';
Resource.waitinglistPossible = 'waitinglistPossible';
Resource.onWaitinglist = 'onWaitinglist';
Resource.full = 'full';
Resource.canSubscribeFromWaitinglist = 'canSubscribeFromWaitinglist'; // is on waitinglist and entitled to subscribe

module.exports = Resource;
