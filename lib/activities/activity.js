"use strict";

var moment = require('moment-timezone');
var beans = require('nconf').get('beans');
var Resource = beans.get('resource');
var ical = require('icalendar');
var misc = beans.get('misc');
var fieldHelpers = beans.get('fieldHelpers');
var Renderer = beans.get('renderer');

function Activity() {
  this.color = 'aus Gruppe';
  this.startUnix = moment().unix();
  this.endUnix = moment().add(2, 'hours').unix();
  this.resources = {default: new Resource()};
  return this;
}

// XXX remove duplication with fillFromUI and copyFrom
Activity.prototype.fillFromDB = function (object) {
  if (object) {
    this.id = object.id;
    this.url = object.url.trim();
    this.title = object.title;
    this.description = object.description;
    this.assignedGroup = object.assignedGroup;
    this.location = object.location;
    this.direction = object.direction;
    if (object.startUnix) {
      this.startUnix = object.startUnix;
      this.endUnix = object.endUnix ? object.endUnix : object.startUnix;
    } else {
      // currently we only support Germany for events
      this.startUnix = fieldHelpers.parseToUnixUsingDefaultTimezone(object.startDate, object.startTime);
      this.endUnix = fieldHelpers.parseToUnixUsingDefaultTimezone(object.endDate, object.endTime);
    }
    this.color = object.color;
    this.resources = {default: new Resource(misc.toArray(
        object.resources && object.resources['default'] ?
            object.resources['default']._registeredMembers : object.registeredMembers))};
  }
  return this;
};


// XXX remove duplication with fillFromDB and copyFrom
Activity.prototype.fillFromUI = function (object) {
  this.id = object.id;
  this.url = object.url.trim();
  this.title = object.title;
  this.description = object.description;
  this.assignedGroup = object.assignedGroup;
  this.location = object.location;
  this.direction = object.direction;
  if (object.startUnix) {
    this.startUnix = object.startUnix;
    this.endUnix = object.endUnix ? object.endUnix : object.startUnix;
  } else {
    // currently we only support Germany for events
    this.startUnix = fieldHelpers.parseToUnixUsingDefaultTimezone(object.startDate, object.startTime);
    this.endUnix = fieldHelpers.parseToUnixUsingDefaultTimezone(object.endDate, object.endTime);
  }
  this.color = object.color;
  return this;
};


Activity.prototype.descriptionHTML = function () {
  return Renderer.render(this.description, this.assignedGroup);
};

Activity.prototype.descriptionPlain = function () {
  return this.descriptionHTML().replace(/<(?:.|\n)*?>/gm, '');
};

Activity.prototype.hasDirection = function () {
  return fieldHelpers.isFilled(this.direction);
};

Activity.prototype.directionHTML = function () {
  return Renderer.render(this.direction, this.assignedGroup);
};

Activity.prototype.markdown = function () {
  var markdown = this.description + '\n\n**Datum:** ' + this.startDate() + ', ' + this.startTime() + '\n\n**Ort:** ' + this.location;
  if (this.hasDirection()) {
    markdown = markdown + '\n\n **Wegbeschreibung:**\n\n' + this.direction;
  }
  return markdown;
};

Activity.prototype.groupNameFrom = function (groups) {
  for (var i in groups) {
    if (groups[i].id === this.assignedGroup) { return groups[i].longName; }
  }
  return "";
};

Activity.prototype.registeredMembers = function () {
  return this.resources['default'].registeredMembers();
};

Activity.prototype.addMemberId = function (memberId) {
  this.resources['default'].addMemberId(memberId);
};

Activity.prototype.removeMemberId = function (memberId) {
  this.resources['default'].removeMemberId(memberId);
};

// Display Dates and Times

Activity.prototype.startDate = function () {
  return fieldHelpers.readableDateFromMoment(this.startMoment());
};

Activity.prototype.startTime = function () {
  return fieldHelpers.readableTimeFromMoment(this.startMoment());
};

Activity.prototype.startMoment = function () {
  return moment.unix(this.startUnix).tz(fieldHelpers.defaultTimezone());
};

Activity.prototype.endDate = function () {
  return fieldHelpers.readableDateFromMoment(this.endMoment());
};

Activity.prototype.endTime = function () {
  return fieldHelpers.readableTimeFromMoment(this.endMoment());
};

Activity.prototype.endMoment = function () {
  return moment.unix(this.endUnix).tz(fieldHelpers.defaultTimezone());
};

// updating Dates and Times
Activity.prototype.updateStartDateWith = function (value) {
  this.startUnix = fieldHelpers.parseToUnixUsingDefaultTimezone(value, this.startTime());
};

Activity.prototype.updateStartTimeWith = function (value) {
  this.startUnix = fieldHelpers.parseToUnixUsingDefaultTimezone(this.startDate(), value);
};

Activity.prototype.updateEndDateWith = function (value) {
  this.endUnix = fieldHelpers.parseToUnixUsingDefaultTimezone(value, this.endTime());
};

Activity.prototype.updateEndTimeWith = function (value) {
  this.endUnix = fieldHelpers.parseToUnixUsingDefaultTimezone(this.endDate(), value);
};

Activity.prototype.month = function () {
  return this.startMoment().month();
};

Activity.prototype.year = function () {
  return this.startMoment().year();
};

Activity.prototype.colorFrom = function (groupsColors, allColors) {
  if (this.color === 'aus Gruppe') {
    return groupsColors[this.assignedGroup];
  }
  for (var i in allColors) {
    if (allColors[i].id === this.color) {
      return allColors[i].color;
    }
  }
  return '#353535';
};

Activity.prototype.resetForClone = function () {
  var today = fieldHelpers.readableDateFromMoment(moment());
  var result = new Activity();
  result.copyFrom(this);
  result.resources['default']._registeredMembers = [];
  result.updateStartDateWith(today);
  result.updateEndDateWith(today);
  result.id = null;
  result.url = null;
  return result;
};

// XXX remove duplication with fillFromDB and fillFromUI
Activity.prototype.copyFrom = function (object) {
  this.id = object.id;
  this.url = object.url.trim();
  this.title = object.title;
  this.description = object.description;
  this.assignedGroup = object.assignedGroup;
  this.location = object.location;
  this.direction = object.direction;
  if (object.startUnix) {
    this.startUnix = object.startUnix;
    this.endUnix = object.endUnix ? object.endUnix : object.startUnix;
  } else {
    // currently we only support Germany for events
    this.startUnix = fieldHelpers.parseToUnixUsingDefaultTimezone(object.startDate, object.startTime);
    this.endUnix = fieldHelpers.parseToUnixUsingDefaultTimezone(object.endDate, object.endTime);
  }
  this.color = object.color;
  this.resources = {default: new Resource(misc.toArray(
      object.resources && object.resources['default'] ?
          object.resources['default']._registeredMembers : object.registeredMembers))};
  return this;
};

Activity.prototype.asCalendarEvent = function (groupsColors, allColors) {
  return {
    start: this.startMoment().toISOString(),
    end: this.endMoment().toISOString(),
    url: '/activities/' + encodeURIComponent(this.url),
    title: this.title,
    startTime: this.startTime(),
    className: 'verySmall',
    dayOfWeek: this.startMoment().day(),
    color: this.colorFrom(groupsColors, allColors)
  };
};

Activity.prototype.asICal = function () {
  var event = new ical.VEvent(this.url);
  event.setSummary(this.title);
  event.setDescription(this.description);
  event.addProperty('LOCATION', this.location);
  event.setDate(this.startMoment().toDate(), this.endMoment().toDate());
  return event;
};

module.exports = Activity;
