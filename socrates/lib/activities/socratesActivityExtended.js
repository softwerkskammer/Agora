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
    var resource = new SoCraTesResource(_.first(this.registeredResources(memberID)));
    if (!resource) { return null; }
    var record = resource.recordFor(memberID);
    if (record) {
      return resource.resourceName + ',' + record.duration;
    }
    if (resource.waitinglistRecordFor(memberID)) {
      return resource.resourceName + ',waitinglist';
    }
    return null;
  };

}

module.exports = SoCraTesActivity;


