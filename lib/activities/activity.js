"use strict";

var moment = require('moment-timezone');
var beans = require('nconf').get('beans');
var ical = require('icalendar');
var misc = beans.get('misc');
var fieldHelpers = beans.get('fieldHelpers');
var Renderer = beans.get('renderer');

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
      if (object.startDate) {
        var time = object.startTime ? object.startTime : '00:00';
        this.startUnix = moment.utc(object.startDate + " " + time, 'D.M.YYYY H:m').unix();
      }
      var endTime = object.endTime ? object.endTime : (object.startTime ? object.startTime : '00:00');
      this.endUnix = moment.utc((object.endDate ? object.endDate : object.startDate) + " " + endTime, 'D.M.YYYY H:m').unix();
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
  return Renderer.render(this.description, this.assignedGroup);
};

Activity.prototype.descriptionHTMLWithoutAnchors = function () {
  return this.descriptionHTML().replace(/<a.*>/g, "").replace(/<\/a>/g, "");
};

Activity.prototype.directionHTML = function () {
  return Renderer.render(this.direction, this.assignedGroup);
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
  return fieldHelpers.readableDate(this.startUnix);
};

Activity.prototype.startTime = function () {
  return fieldHelpers.readableTime(this.startUnix);
};

Activity.prototype.endDate = function () {
  return fieldHelpers.readableDate(this.endUnix);
};

Activity.prototype.endTime = function () {
  return fieldHelpers.readableTime(this.endUnix);
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

Activity.prototype.resetForClone = function () {
  var result = new Activity(this);
  result.registeredMembers = [];
  result.updateStartDateWith(moment().format('DD.MM.YYYY'));
  result.updateEndDateWith(moment().format('DD.MM.YYYY'));
  result.id = null;
  result.url = null;
  return result;
};

Activity.prototype.asCalendarEvent = function (groupsColors, allColors) {
  return {
    start: moment.unix(this.startUnix).toISOString(),
    end: moment.unix(this.endUnix).toISOString(),
    url: '/activities/' + encodeURIComponent(this.url),
    title: this.title,
    startTime: this.startTime(),
    className: 'verySmall',
    dayOfWeek: moment.unix(this.startUnix).utc().day(),
    color: this.colorFrom(groupsColors, allColors)
  };
};

Activity.prototype.asICal = function () {
  var event = new ical.VEvent(this.url);
  event.setSummary(this.title);
  event.setDescription(this.description);
  event.addProperty('LOCATION', this.location);
  // for display - and the users calendar is a display - we have to convert the utc based time and date to a local date
  // currently we only support Germany for events
  event.setDate(fieldHelpers.convertUtcToBerlinMoment(this.startUnix), fieldHelpers.convertUtcToBerlinMoment(this.endUnix));
  return event;
};

Activity.prototype.adjustEndDate = function () {
  if (moment.unix(this.endUnix).isBefore(moment.unix(this.startUnix))) {
    this.endUnix = this.startUnix;
    return true;
  }
  return false;
};

module.exports = Activity;
