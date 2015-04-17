'use strict';

var _ = require('lodash');
var conf = require('simple-configure');
var beans = conf.get('beans');
var SoCraTesActivity = beans.get('socratesActivity');
var SoCraTesResource = beans.get('socratesResource');

if (SoCraTesActivity.prototype.reserve === undefined) {
  SoCraTesActivity.prototype.socratesResourceNamed = function (registrationTuple) {
    return new SoCraTesResource(this.resourceNamed(registrationTuple.resourceName));
  };

  SoCraTesActivity.prototype.reserve = function (registrationTuple) {
    return this.socratesResourceNamed(registrationTuple).reserve(registrationTuple);
  };

  SoCraTesActivity.prototype.register = function (memberID, registrationTuple) {
    return this.socratesResourceNamed(registrationTuple).register(memberID, registrationTuple);
  };

  SoCraTesActivity.prototype.hasValidReservationFor = function (registrationTuple) {
    return this.socratesResourceNamed(registrationTuple).hasValidReservationFor(registrationTuple);
  };

  SoCraTesActivity.prototype.hasValidWaitinglistReservationFor = function (registrationTuple) {
    return this.socratesResourceNamed(registrationTuple).hasValidWaitinglistReservationFor(registrationTuple);
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

}

module.exports = SoCraTesActivity;


