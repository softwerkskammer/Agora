"use strict";

var moment = require('moment');

function isFilled(string) {
  return string !== undefined && string !== null && string.trim().length > 0;
}

function Activity(title, description, assignedGroup, location, direction, activityDate, startTime) {
  this.title = title;
  this.description = description;
  this.assignedGroup = assignedGroup;
  this.location = location;
  this.direction = direction;
  this.activityDate = activityDate;
  this.startTime = startTime;
  this.startUnix = moment(activityDate + " " + startTime, 'D.M.YYYY H:m').unix();
}

Activity.prototype.fromObject = function (object) {
  this.title = object.title;
  this.description = object.description;
  this.assignedGroup = object.assignedGroup;
  this.location = object.location;
  this.direction = object.direction;
  this.activityDate = object.activityDate;
  this.startTime = object.startTime;
  this.startUnix = moment(object.activityDate + " " + object.startTime, 'D.M.YYYY H:m').unix();

  if (!isFilled(object.id))  {
    this.createLink();
  } else {
    this.id = object.id;
  }

  return this;
};

Activity.prototype.isValid = function () {
  return isFilled(this.assignedGroup) && isFilled(this.title) && isFilled(this.activityDate);
};

Activity.prototype.createLink = function () {
  var idValue = null;
  var fields = [this.assignedGroup, this.title, this.activityDate];

  fields.forEach(function (field) {
    if (isFilled(idValue)) {
      idValue = idValue + '_' + field;
    } else {
      idValue = field;
    }
  });

  idValue = idValue.replace(/[ ,!?ßöäü:"']/g, '_');

  this.id = idValue;

  return this.id;
};

module.exports = Activity;
