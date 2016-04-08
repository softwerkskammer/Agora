'use strict';

var moment = require('moment-timezone');
var _ = require('lodash');

var conf = require('simple-configure');
var beans = conf.get('beans');
var Resources = beans.get('resources');
var fieldHelpers = beans.get('fieldHelpers');
var Renderer = beans.get('renderer');

var standardName = 'Veranstaltung';

function Activity(object) {
  /* eslint no-underscore-dangle: 0 */
  if (object) {
    this.state = object;
  } else {
    this.state = {};
  }

  if (!this.state.resources) {
    this.state.resources = {};
    this.state.resources[standardName] = {_registeredMembers: [], _registrationOpen: true};
  }

  if (!this.state._addons) {
    this.state._addons = {};
  }
  return this;
}

Activity.standardName = standardName;

Activity.prototype.id = function () {
  return this.state.id;
};

Activity.prototype.url = function () {
  return this.state.url ? this.state.url.trim() : undefined;
};

Activity.prototype.fullyQualifiedUrl = function () {
  return this.url() ? conf.get('publicUrlPrefix') + '/activities/' + encodeURIComponent(this.url()) : undefined;
};

Activity.prototype.title = function () {
  return this.state.title;
};

Activity.prototype.description = function () {
  return this.state.description;
};

Activity.prototype.location = function () {
  return this.state.location;
};

Activity.prototype.direction = function () {
  return this.state.direction;
};

Activity.prototype.startUnix = function () {
  return this.state.startUnix || moment().unix();
};

Activity.prototype.endUnix = function () {
  return this.state.endUnix || moment().add(2, 'hours').unix();
};

Activity.prototype.assignedGroup = function () {
  return this.state.assignedGroup;
};

Activity.prototype.owner = function () {
  return this.state.owner;
};

Activity.prototype.editorIds = function () {
  return this.state.editorIds || [];
};

// XXX remove duplication with copyFrom
Activity.prototype.fillFromUI = function (object, editorIds) {
  var self = this;
  self.state.url = object.url;

  self.state.editorIds = editorIds;

  self.state.title = object.title;
  self.state.description = object.description;
  self.state.assignedGroup = object.assignedGroup;
  self.state.location = object.location;
  self.state.direction = object.direction;
  // currently we only support MEZ/MESZ for events
  self.state.startUnix = fieldHelpers.parseToUnixUsingDefaultTimezone(object.startDate, object.startTime);
  self.state.endUnix = fieldHelpers.parseToUnixUsingDefaultTimezone(object.endDate, object.endTime);

  if (!self.id() || self.id() === 'undefined') {
    self.state.id = fieldHelpers.createLinkFrom([self.assignedGroup(), self.title(), self.startMoment()]);
  }

  // these are the resource definitions in the edit page:
  if (object.resources) {
    this.resources().fillFromUI(object.resources);
  }

  self.state.isSoCraTes = object.isSoCraTes;

  return self;
};

// TODO merge resetForClone and copyFrom
Activity.prototype.resetForClone = function () {
  return new Activity().copyFrom(this);
};

// XXX remove duplication with fillFromUI
Activity.prototype.copyFrom = function (originalActivity) {
  this.state.editorIds = originalActivity.editorIds();
  this.state.title = originalActivity.title();
  this.state.description = originalActivity.description();
  this.state.assignedGroup = originalActivity.assignedGroup();
  this.state.location = originalActivity.location();
  this.state.direction = originalActivity.direction();
  this.state.startUnix = originalActivity.startUnix();
  this.state.endUnix = originalActivity.endUnix();

  this.state.resources = {};
  this.resources().copyFrom(originalActivity.resources());
  return this;
};

Activity.prototype.isSoCraTes = function () {
  return this.state.isSoCraTes;
};

Activity.prototype.descriptionHTML = function () {
  return Renderer.render(this.description(), this.assignedGroup());
};

Activity.prototype.descriptionPlain = function () {
  return this.descriptionHTML().replace(/<(?:\S|\s)*?>/gm, '');
};

Activity.prototype.hasDirection = function () {
  return fieldHelpers.isFilled(this.direction());
};

Activity.prototype.directionHTML = function () {
  return Renderer.render(this.direction(), this.assignedGroup());
};

Activity.prototype.groupName = function () {
  return this.group ? this.group.longName : '';
};

Activity.prototype.groupFrom = function (groups) {
  this.group = _.find(groups, {id: this.assignedGroup()});
};

// Resources

Activity.prototype.resources = function () {
  return new Resources(this.state.resources);
};

Activity.prototype.resourceNamed = function (resourceName) {
  return this.resources().named(resourceName);
};

Activity.prototype.resourceNames = function () {
  return this.resources().resourceNames();
};

Activity.prototype.allRegisteredMembers = function () {
  return this.resources().allRegisteredMembers();
};

Activity.prototype.isAlreadyRegistered = function (memberID) {
  return this.allRegisteredMembers().indexOf(memberID) > -1;
};

Activity.prototype.isAlreadyOnWaitinglist = function (memberID) {
  return _(this.allWaitinglistEntries()).find(function (entry) { return entry.registrantId() === memberID; });
};

Activity.prototype.registeredResourcesFor = function (memberID) {
  var self = this;
  return _.map(self.resources().resourceNamesOf(memberID), function (resourceName) {
    return self.resourceNamed(resourceName);
  });
};

Activity.prototype.waitinglistResourcesFor = function (memberID) {
  var self = this;
  return _.map(self.resources().waitinglistResourceNamesOf(memberID), function (resourceName) {
    return self.resourceNamed(resourceName);
  });
};

Activity.prototype.allWaitinglistEntries = function () {
  return this.resources().allWaitinglistEntries();
};

// Display Dates and Times

Activity.prototype.isMultiDay = function () {
  return this.endMoment().dayOfYear() !== this.startMoment().dayOfYear();
};

Activity.prototype.startMoment = function () {
  return moment.unix(this.startUnix()).tz(fieldHelpers.defaultTimezone());
};

Activity.prototype.endMoment = function () {
  return moment.unix(this.endUnix()).tz(fieldHelpers.defaultTimezone());
};

Activity.prototype.month = function () {
  return this.startMoment().month();
};

Activity.prototype.year = function () {
  return this.startMoment().year();
};

Activity.prototype.colorFrom = function (groupsColors) {
  return groupsColors && groupsColors[this.assignedGroup()] ? groupsColors[this.assignedGroup()] : '#353535';
};

// Helper functions for non-persistent information

Activity.prototype.participantsOf = function (resourceName) {
  if (!this.participants) { return []; }
  var resource = this.resourceNamed(resourceName);
  var memberIds = resource.registeredMembers();
  return _(this.participants).filter(function (participant) {
    return _.some(memberIds, function (memberId) {
      return memberId === participant.id();
    });
  }).map(function (member) {
    member.registeredAt = resource.registrationDateOf(member.id());
    return member;
  }).value();
};

module.exports = Activity;
