"use strict";

function isFilled(string) {
  return string !== undefined && string !== null && string.trim().length > 0;
}

function Activity(id, title, description, assignedGroup, location, direction, activityDate, startTime) {
  this.id = id;
  this.title = title;
  this.description = description;
  this.assignedGroup = assignedGroup;
  this.location = location;
  this.direction = direction;
  this.activityDate = activityDate;
  this.startTime = startTime;
}

Activity.prototype.fromObject = function (object) {
  this.id = object.id;
  this.title = object.title;
  this.description = object.description;
  this.assignedGroup = object.assignedGroup;
  this.location = object.location;
  this.direction = object.direction;
  this.activityDate = object.activityDate;
  this.startTime = object.startTime;
  return this;
};

Activity.prototype.isValid = function () {
  return isFilled(this.id);
};

module.exports = Activity;
