"use strict";

var moment = require('moment-timezone');
var markdown = require('markdown').markdown;
var conf = require('nconf');
var ical = require('icalendar');
var misc = conf.get('beans').get('misc');
var fieldHelpers = conf.get('beans').get('fieldHelpers');

function Activity(object) {
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
    this.registeredMembers = misc.toArray(object.registeredMembers);
  } else {
    this.color = 'aus Gruppe';
    this.startUnix = moment.utc().unix();
    this.endUnix = moment.utc().unix();
  }
  return this;
}

Activity.prototype.descriptionHTML = function () {
  return markdown.toHTML(this.description.replace(/\r/g, ''));
};

Activity.prototype.directionHTML = function () {
  return markdown.toHTML(this.direction.replace(/\r/g, ''));
};

Activity.prototype.groupName = function (groups) {
  for (var i in groups) {
    if (groups[i].id === this.assignedGroup) { return groups[i].longName; }
  }
  return "";
};

Activity.prototype.addMemberId = function (memberId) {
  if (!this.registeredMembers) {
    this.registeredMembers = [];
  }
  if (this.registeredMembers.indexOf(memberId) === -1) {
    this.registeredMembers.push(memberId);
  }
};

Activity.prototype.removeMemberId = function (memberId) {
  if (this.registeredMembers === undefined) {
    return;
  }
  var index = this.registeredMembers.indexOf(memberId);
  if (index > -1) {
    this.registeredMembers.splice(index, 1);
  }
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
  this.startUnix = moment.utc(value + " " + this.startTime(), 'D.M.YYYY H:m').unix();
};

Activity.prototype.updateStartTimeWith = function (value) {
  this.startUnix = moment.utc(this.startDate() + " " + value, 'D.M.YYYY H:m').unix();
};

Activity.prototype.updateEndDateWith = function (value) {
  this.endUnix = moment.utc(value + " " + this.endTime(), 'D.M.YYYY H:m').unix();
};

Activity.prototype.updateEndTimeWith = function (value) {
  this.endUnix = moment.utc(this.endDate() + " " + value, 'D.M.YYYY H:m').unix();
};

Activity.prototype.month = function () {
  return moment.unix(this.startUnix).utc().month();
};

Activity.prototype.year = function () {
  return moment.unix(this.startUnix).utc().year();
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
