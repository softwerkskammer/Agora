"use strict";

var markdown = require('markdown').markdown;
var moment = require('moment');
var conf = require('nconf');
var fieldHelpers = conf.get('beans').get('fieldHelpers');

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
  return markdown.toHTML(this.message.replace(/\r/g, ''));
};

module.exports = Announcement;
