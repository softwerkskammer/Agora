'use strict';

var _ = require('lodash');
var conf = require('simple-configure');
var beans = conf.get('beans');
var SoCraTesActivity = beans.get('socratesActivity');
var SoCraTesResource = beans.get('socratesResource');

if (SoCraTesActivity.prototype.reserve === undefined) {
  SoCraTesActivity.prototype.socratesResourceFor = function (registrationTuple) {
    return new SoCraTesResource(this.resourceNamed(registrationTuple.resourceName));
  };

  SoCraTesActivity.prototype.socratesResourceNamed = function (resourceName) {
    return new SoCraTesResource(this.resourceNamed(resourceName));
  };

  SoCraTesActivity.prototype.reserve = function (registrationTuple) {
    return this.socratesResourceFor(registrationTuple).reserve(registrationTuple);
  };

  SoCraTesActivity.prototype.register = function (memberID, registrationTuple) {
    return this.socratesResourceFor(registrationTuple).register(memberID, registrationTuple);
  };

  SoCraTesActivity.prototype.hasValidReservationFor = function (registrationTuple) {
    return this.socratesResourceFor(registrationTuple).hasValidReservationFor(registrationTuple);
  };

  SoCraTesActivity.prototype.selectedOptionFor = function (memberID) {
    var regResource = _.first(this.registeredResourcesFor(memberID));
    if (regResource) {
      return regResource.resourceName + ',' + new SoCraTesResource(regResource).recordFor(memberID).duration;
    }

    var waitResource = _.first(this.waitinglistResourcesFor(memberID));
    if (waitResource) {
      return waitResource.resourceName + ',waitinglist';
    }
    return null;
  };

  SoCraTesActivity.prototype.expirationTimeOf = function (registrationTuple) {
    return this.socratesResourceFor(registrationTuple).expirationTimeOf(registrationTuple);
  };

  SoCraTesActivity.prototype.waitinglistParticipantsOf = function (resourceName) {
    if (!this.waitinglistMembers) { return []; }
    return this.waitinglistMembers[resourceName];
  };

}

module.exports = SoCraTesActivity;


