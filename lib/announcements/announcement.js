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
    var now = parseInt(object.fromDate, 10) || moment.utc().unix();
    this.fromDate = now;
    this.thruDate = object.thruDate;
  }
  return this;
}

Announcement.prototype.isValid = function () {
  return !!this.id;
};

Announcement.prototype.readableDate = function (unixtimestamp) {
  return fieldHelpers.readableDate(unixtimestamp);
};

Announcement.prototype.messageHTML = function () {
  return markdown.toHTML(this.message.replace(/\r/g, ''));
};

Announcement.AnnouncementsUntilToday = function (announcements) {
  return announcements.filter(function (announcement) {
    return announcement.thruDate >= moment.utc().unix();
  });
};

Announcement.AnnouncementsExpired = function (announcements) {
  return announcements.filter(function (announcement) {
    return announcement.thruDate < moment.utc().unix();
  });
};

module.exports = Announcement;
