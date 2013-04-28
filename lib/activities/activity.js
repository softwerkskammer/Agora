"use strict";

var fieldHelpers = require('../commons/fieldHelpers');
var moment = require('moment');
var markdown = require('markdown').markdown;

function Activity(object) {
  if (object) {
    if (!object.id) {
      this.id = fieldHelpers.createLinkFrom([object.assignedGroup, object.title, object.startDate]);
    } else {
      this.id = object.id;
    }
    this.title = object.title;
    this.description = object.description;
    this.assignedGroup = object.assignedGroup;
    this.location = object.location;
    this.direction = object.direction;
    this.startDate = object.startDate;
    this.startTime = object.startTime;
    this.startUnix = moment(object.startDate + " " + object.startTime, 'D.M.YYYY H:m').unix();
    this.endDate = object.endDate;
    this.endTime = object.endTime;
    this.color = object.color;
  }
  return this;
}

Activity.prototype.descriptionHTML = function () {
  return markdown.toHTML(this.description);
};

Activity.prototype.directionHTML = function () {
  return markdown.toHTML(this.direction);
};

Activity.prototype.groupName = function (groups) {
  for (var i in groups) {
    if (groups[i].id === this.assignedGroup) {
      return groups[i].longName;
    }
  }
  return "";
};

Activity.prototype.month = function () {
  return moment.unix(this.startUnix).month();
};

Activity.prototype.year = function () {
  return moment.unix(this.startUnix).year();
};

Activity.prototype.endUnix = function () {
  var date = this.endDate ? this.endDate : this.startDate;
  var time = this.endTime ? this.endTime : this.startTime;
  return moment(date + " " + time, 'D.M.YYYY H:m').unix();
};

Activity.prototype.asCalendarEvent = function () {
  return {
    title: this.title,
    start: this.startUnix,
    end: this.endUnix(),
    url: '/activities/' + this.id,
    activity: this,
    className: 'verySmall',
    dayOfWeek: moment.unix(this.startUnix).day(),
    color: this.color
  };
};

module.exports = Activity;
