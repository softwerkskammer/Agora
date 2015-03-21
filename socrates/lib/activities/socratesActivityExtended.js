'use strict';

var _ = require('lodash');
var conf = require('simple-configure');
var beans = conf.get('beans');
var SoCraTesActivity = beans.get('socratesActivity');
var SoCraTesResource = beans.get('socratesResource');

if (SoCraTesActivity.prototype.reserve === undefined) {
  SoCraTesActivity.prototype.socratesResourceNamed = function (name) {
    return new SoCraTesResource(this.resourceNamed(name));
  };

  SoCraTesActivity.prototype.stripExpiredReservations = function () {
    var self = this;
    _.each(this.resourceNames(), function (name) {
      self.socratesResourceNamed(name).stripExpiredReservations();
    });
  };

  SoCraTesActivity.prototype.reserve = function (registrationTuple) {
    this.stripExpiredReservations();
    return this.socratesResourceNamed(registrationTuple.resourceName).reserve(registrationTuple);
  };

  SoCraTesActivity.prototype.register = function (memberID, registrationTuple) {
    this.stripExpiredReservations();
    return this.socratesResourceNamed(registrationTuple.resourceName).register(memberID, registrationTuple);
  };

  SoCraTesActivity.prototype.hasValidReservationFor = function (registrationTuple) {
    return this.socratesResourceNamed(registrationTuple.resourceName).hasValidReservationFor(registrationTuple);
  };

  SoCraTesActivity.prototype.selectedOptionFor = function (memberID) {
    var resource = new SoCraTesResource(_.first(this.registeredResources(memberID)));
    if (!resource) { return null; }
    var record = resource.recordFor(memberID);
    if (!record) { return null; }
    return resource.resourceName + ',' + record.duration;
  };

}

module.exports = SoCraTesActivity;


