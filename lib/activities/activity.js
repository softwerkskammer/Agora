"use strict";

var fieldHelpers = require('../commons/fieldHelpers');
var moment = require('moment');

function Activity(object) {
  if (object) {
    this.title = object.title;
    this.description = object.description;
    this.assignedGroup = object.assignedGroup;
    this.location = object.location;
    this.direction = object.direction;
    this.activityDate = object.activityDate;
    this.startTime = object.startTime;
    this.startUnix = moment(object.activityDate + " " + object.startTime, 'D.M.YYYY H:m').unix();

    if (!fieldHelpers.isFilled(object.id)) {
      this.id = fieldHelpers.createLinkFrom([this.assignedGroup, this.title, this.activityDate]);
    } else {
      this.id = object.id;
    }
  }
  return this;
}

Activity.prototype.isValid = function () {
  return fieldHelpers.isFilled(this.assignedGroup) && fieldHelpers.isFilled(this.title) && fieldHelpers.isFilled(this.activityDate);
};

module.exports = Activity;
