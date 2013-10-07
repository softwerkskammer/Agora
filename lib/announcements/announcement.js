"use strict";

var moment = require('moment-timezone');
var beans = require('nconf').get('beans');
var fieldHelpers = beans.get('fieldHelpers');
var Renderer = beans.get('renderer');

function Announcement(object) {
  if (object) {
    this.id = object.id;
    this.url = object.url.trim();
    this.title = object.title;
    this.message = object.message;
    this.author = object.author;
    if (typeof object.fromUnix === "string") {
      this.fromUnix = parseInt(object.fromUnix, 10);
    } else {
      this.fromUnix = object.fromUnix;
    }
    if (object.thruUnix) {
      this.thruUnix = object.thruUnix;
    } else {
      if (object.thruDate && object.thruDate !== '') {
        this.thruUnix = moment.utc(object.thruDate, 'D.M.YYYY').unix();
      }
    }
  } else {
    this.fromUnix = moment.utc().unix();
    this.thruUnix = moment.utc().add('M', 1).unix();
  }
  return this;
}

Announcement.prototype.isValid = function () {
  return !!this.id;
};

Announcement.prototype.fromDate = function () {
  return fieldHelpers.readableDate(this.fromUnix);
};

Announcement.prototype.thruDate = function () {
  return fieldHelpers.readableDate(this.thruUnix);
};

Announcement.prototype.updateFromDateWith = function (value) {
  this.fromUnix = moment.utc(value, 'D.M.YYYY').unix();
};

Announcement.prototype.updateThruDateWith = function (value) {
  this.thruUnix = moment.utc(value, 'D.M.YYYY').unix();
};

Announcement.prototype.messageHTML = function () {
  return Renderer.render(this.message, this.assignedGroup);
};

module.exports = Announcement;
