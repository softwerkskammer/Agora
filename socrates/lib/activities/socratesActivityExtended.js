'use strict';

var conf = require('simple-configure');
var beans = conf.get('beans');
var SoCraTesActivity = beans.get('socratesActivity');
var SoCraTesResource = beans.get('socratesResource');

if (SoCraTesActivity.prototype.socratesResourceNamed === undefined) {
  SoCraTesActivity.prototype.socratesResourceNamed = function (resourceName) {
    return new SoCraTesResource(this.resourceNamed(resourceName));
  };
}

module.exports = SoCraTesActivity;


