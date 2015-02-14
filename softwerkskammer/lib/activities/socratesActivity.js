'use strict';

var conf = require('simple-configure');
var beans = conf.get('beans');
var Activity = beans.get('activity');
var Group = beans.get('group');

function SoCraTesActivity(object) {
  this.activity = new Activity(object);
}

SoCraTesActivity.prototype.title = function () {
  return this.activity.title();
};

SoCraTesActivity.prototype.startMoment = function () {
  return this.activity.startMoment();
};

SoCraTesActivity.prototype.fullyQualifiedUrl = function () {
  return this.activity.state.url ? conf.get('socratesURL') + '/activities/' + encodeURIComponent(this.activity.state.url.trim()) : undefined;
};

SoCraTesActivity.prototype.allRegisteredMembers = function () {
  return this.activity.allRegisteredMembers();
};

SoCraTesActivity.prototype.assignedGroup = function () {
  return undefined;
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