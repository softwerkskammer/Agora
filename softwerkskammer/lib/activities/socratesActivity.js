'use strict';

var conf = require('simple-configure');
var beans = conf.get('beans');
var Activity = beans.get('activity');
var Group = beans.get('group');

function SoCraTesActivity(object) {
  this.activity = new Activity(object);
  this.state = this.activity.state; // required for persisting
}

// inherit from Activity:
SoCraTesActivity.prototype = new Activity();

SoCraTesActivity.prototype.isSoCraTes = function () {
  return this.activity.isSoCraTes(); // should always be true
};

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