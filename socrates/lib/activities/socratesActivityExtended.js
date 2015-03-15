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

  SoCraTesActivity.prototype.reserve = function (registrationTuple) {
    var self = this;
    _.each(this.resourceNames(), function (name) {
      self.socratesResourceNamed(name).stripExpiredReservations();
    });
    return this.socratesResourceNamed(registrationTuple.resourceName).reserve(registrationTuple);
  };
}

module.exports = SoCraTesActivity;


