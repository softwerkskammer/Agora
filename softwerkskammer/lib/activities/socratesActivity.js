'use strict';

var conf = require('simple-configure');
var beans = conf.get('beans');
var Activity = beans.get('activity');

function SoCraTesActivity(object) {
  this.state = new Activity(object).state; // required for persisting
}

// inherit from Activity:
SoCraTesActivity.prototype = new Activity();

SoCraTesActivity.prototype.fullyQualifiedUrl = function () {
  return conf.get('socratesURL');
};

SoCraTesActivity.prototype.assignedGroup = function () {
  return 'G'; // this must not return undefined for SoCraTes to work
};

SoCraTesActivity.prototype.groupName = function () {
  return undefined;
};

SoCraTesActivity.prototype.colorFrom = function () {
  return '#3771C8';
};

SoCraTesActivity.prototype.groupFrom = function () {
  return undefined;
};

module.exports = SoCraTesActivity;
