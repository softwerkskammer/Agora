'use strict';

var conf = require('simple-configure');
var beans = conf.get('beans');
var Activity = beans.get('activity');
var Group = beans.get('group');

function SoCraTesActivity(object) {
  this.activity = new Activity(object);
  this.state = this.activity.state; // required for persisting
}

SoCraTesActivity.prototype.fillFromUI = function (object) {
  return this.activity.fillFromUI(object);
};

SoCraTesActivity.prototype.id = function () {
  return this.activity.id();
};

SoCraTesActivity.prototype.title = function () {
  return this.activity.title();
};

SoCraTesActivity.prototype.startMoment = function () {
  return this.activity.startMoment();
};

SoCraTesActivity.prototype.endMoment = function () {
  return this.activity.endMoment();
};

SoCraTesActivity.prototype.fullyQualifiedUrl = function () {
  return this.activity.state.url ? conf.get('socratesURL') + '/activities/' + encodeURIComponent(this.activity.state.url.trim()) : undefined;
};

SoCraTesActivity.prototype.url = function () {
  return this.activity.url();
};

SoCraTesActivity.prototype.isMultiDay = function () {
  return this.activity.isMultiDay();
};

SoCraTesActivity.prototype.description = function () {
  return this.activity.description();
};

SoCraTesActivity.prototype.descriptionHTML = function () {
  return this.activity.descriptionHTML();
};

SoCraTesActivity.prototype.allRegisteredMembers = function () {
  return this.activity.allRegisteredMembers();
};

SoCraTesActivity.prototype.resourceNames = function () {
  return this.activity.resourceNames();
};

SoCraTesActivity.prototype.resourceNamed = function (resourceName) {
  return this.activity.resourceNamed(resourceName);
};

SoCraTesActivity.prototype.assignedGroup = function () {
  return 'G'; // this must not return undefined for SoCraTes to work
};

SoCraTesActivity.prototype.groupName = function () {
  return undefined;
};

SoCraTesActivity.prototype.owner = function () {
  return undefined;
};

SoCraTesActivity.prototype.colorFrom = function () {
  return '#3771C8';
};

SoCraTesActivity.prototype.groupFrom = function () {
  return undefined;
};

module.exports = SoCraTesActivity;