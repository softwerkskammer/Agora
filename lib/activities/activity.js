"use strict";

var sha1 = require('sha1');

function isFilled(string) {
  return string !== undefined && string !== null && string.trim().length > 0;
}

function calculateId(title, location, activityDate) {
  var idValue = title + location + activityDate;
  return sha1(idValue);
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
  if (!isFilled(object.id)) {
    this.id = calculateId(object.title, object.location, object.activityDate);
  } else {
    this.id = object.id;
  }
  console.log('id: ', this.id);

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
  return isFilled(this.title) && isFilled(this.location) && isFilled(this.activityDate);
};

module.exports = Activity;
