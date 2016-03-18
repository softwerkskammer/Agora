'use strict';

var conf = require('simple-configure');
var beans = conf.get('beans');
var SoCraTesActivity = beans.get('socratesActivity');
var SoCraTesResource = beans.get('socratesResource');

if (SoCraTesActivity.prototype.reserve === undefined) {
  SoCraTesActivity.prototype.socratesResourceNamed = function (resourceName) {
    return new SoCraTesResource(this.resourceNamed(resourceName));
  };

  SoCraTesActivity.prototype.socratesResourceFor = function (registrationTuple) {
    return this.socratesResourceNamed(registrationTuple.resourceName);
  };

  SoCraTesActivity.prototype.reserve = {}; // required for the check above

  SoCraTesActivity.prototype.register = function (memberID, registrationTuple) {
    return this.socratesResourceFor(registrationTuple).register(memberID, registrationTuple);
  };

}

module.exports = SoCraTesActivity;


