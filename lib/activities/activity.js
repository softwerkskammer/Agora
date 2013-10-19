"use strict";

var moment = require('moment-timezone');
var _ = require('underscore');
var beans = require('nconf').get('beans');
var Resource = beans.get('resource');
var ical = require('icalendar');
var misc = beans.get('misc');
var fieldHelpers = beans.get('fieldHelpers');
var Renderer = beans.get('renderer');

//var util = require('util');

function Activity() {
  this.state = {
    resources: {default: new Resource()}
  };
  return this;
}

// XXX remove duplication with fillFromUI and copyFrom
Activity.prototype.fillFromDB = function (object) {
  if (object) {
    this.state = object;

    var objectResources = object.resources;
    if (objectResources) {
      this.state.resources = {};
      var res = this.state.resources;
      _.each(Object.getOwnPropertyNames(objectResources), function (key) {
        var resourceObject = objectResources[key];
        res[key] = new Resource(resourceObject._registeredMembers, resourceObject._limit);
      });
    }
    else {
      // this is for backwards compatibility
      this.state.resources = {default: new Resource(misc.toArray(object.registeredMembers))};
    }
  }
  return this;
};

Activity.prototype.id = function () {
  return this.state.id;
};

Activity.prototype.url = function () {
  return this.state.url ? this.state.url.trim() : undefined;
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

Activity.prototype.color = function () {
  return this.state.color || 'aus Gruppe';
};

Activity.prototype.resources = function () {
  return this.state.resources; // TODO Resources-Objekt
};


// XXX remove duplication with fillFromDB and copyFrom
Activity.prototype.fillFromUI = function (object) {
  this.state.id = object.id;
  this.state.url = object.url.trim();
  this.state.title = object.title;
  this.state.description = object.description;
  this.state.assignedGroup = object.assignedGroup;
  this.state.location = object.location;
  this.state.direction = object.direction;
  // currently we only support MEZ/MESZ for events
  this.state.startUnix = fieldHelpers.parseToUnixUsingDefaultTimezone(object.startDate, object.startTime);
  this.state.endUnix = fieldHelpers.parseToUnixUsingDefaultTimezone(object.endDate, object.endTime);
  this.state.color = object.color;
  return this;
};


Activity.prototype.descriptionHTML = function () {
  return Renderer.render(this.description(), this.assignedGroup());
};

Activity.prototype.descriptionPlain = function () {
  return this.descriptionHTML().replace(/<(?:.|\n)*?>/gm, '');
};

Activity.prototype.hasDirection = function () {
  return fieldHelpers.isFilled(this.direction());
};

Activity.prototype.directionHTML = function () {
  return Renderer.render(this.direction(), this.assignedGroup());
};

Activity.prototype.markdown = function () {
  var markdown = this.description() + '\n\n**Datum:** ' + this.startDate() + ', ' + this.startTime() + '\n\n**Ort:** ' + this.location();
  if (this.hasDirection()) {
    markdown = markdown + '\n\n**Wegbeschreibung:**\n\n' + this.direction();
  }
  return markdown;
};

Activity.prototype.groupNameFrom = function (groups) {
  for (var i in groups) {
    if (groups[i].id === this.assignedGroup()) { return groups[i].longName; }
  }
  return "";
};

Activity.prototype.registeredMembers = function (resource) {
  var actualResource = resource || 'default';
  var currentResource = this.resources()[actualResource];
  return currentResource ? currentResource.registeredMembers() : [];
};

Activity.prototype.addMemberId = function (memberId, resource) {
  var currentResource = this.resources()[resource];
  if (currentResource) {
    currentResource.addMemberId(memberId);
  }
};

Activity.prototype.removeMemberId = function (memberId, resource) {
  var currentResource = this.resources()[resource];
  if (currentResource) {
    currentResource.removeMemberId(memberId);
  }
};

var cleanupResources = function (keys, resources) {
  _.each(keys, function (key) {
    if (!resources[key]) {
      delete resources[key];
    }
  });
};

Activity.prototype.resourceNames = function () {
  var keys = Object.getOwnPropertyNames(this.resources());
  cleanupResources(keys, this.resources()); // TODO do this when actually building up the resources
  keys = Object.getOwnPropertyNames(this.resources());
  if (keys.length > 1) {
    keys = _.filter(keys, function (key) { return key !== 'default'; });
  }
  return keys;
};

// Display Dates and Times

Activity.prototype.startDate = function () {
  return fieldHelpers.readableDateFromMoment(this.startMoment());
};

Activity.prototype.startTime = function () {
  return fieldHelpers.readableTimeFromMoment(this.startMoment());
};

Activity.prototype.startMoment = function () {
  return moment.unix(this.startUnix()).tz(fieldHelpers.defaultTimezone());
};

Activity.prototype.endDate = function () {
  return fieldHelpers.readableDateFromMoment(this.endMoment());
};

Activity.prototype.endTime = function () {
  return fieldHelpers.readableTimeFromMoment(this.endMoment());
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

Activity.prototype.colorFrom = function (groupsColors, allColors) {
  if (groupsColors && this.color() === 'aus Gruppe') {
    return groupsColors[this.assignedGroup()];
  }
  for (var i in allColors) {
    if (allColors[i].id === this.color()) {
      return allColors[i].color;
    }
  }
  return '#353535';
};

// TODO merge resetForClone and copyFrom
Activity.prototype.resetForClone = function () {
  var result = new Activity();
  result.copyFrom(this);
  // TODO move all of this down into the copyFrom method
  result.resources()['default']._registeredMembers = [];
  return result;
};

// XXX remove duplication with fillFromDB and fillFromUI
Activity.prototype.copyFrom = function (originalActivity) {
  this.state.title = originalActivity.title();
  this.state.description = originalActivity.description();
  this.state.assignedGroup = originalActivity.assignedGroup();
  this.state.location = originalActivity.location();
  this.state.direction = originalActivity.direction();
  this.state.startUnix = originalActivity.startUnix();
  this.state.endUnix = originalActivity.endUnix();
  this.state.color = originalActivity.color();
  this.state.resources = {default: new Resource(misc.toArray(
    originalActivity.resources() && originalActivity.resources()['default'] ?
      originalActivity.resources()['default']._registeredMembers : originalActivity.registeredMembers()))};
  return this;
};

Activity.prototype.asCalendarEvent = function (groupsColors, allColors) {
  var self = this;
  return {
    start: self.startMoment().toISOString(),
    end: self.endMoment().toISOString(),
    url: '/activities/' + encodeURIComponent(self.url()),
    title: self.title(),
    startTime: self.startTime(),
    className: 'verySmall',
    dayOfWeek: self.startMoment().day(),
    color: self.colorFrom(groupsColors, allColors)
  };
};

Activity.prototype.asICal = function () {
  var event = new ical.VEvent(this.url());
  event.setSummary(this.title());
  event.setDescription(this.description());
  event.addProperty('LOCATION', this.location());
  event.setDate(this.startMoment().toDate(), this.endMoment().toDate());
  return event;
};

module.exports = Activity;
