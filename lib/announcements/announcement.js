"use strict";
var sha1 = require('sha1');

function Announcement(title, shortDescription, text, author, fromDate, thruDate) {
  var now = fromDate || Date.now();
  this.fromDate = now;
  var idValue = title + this.fromDate;

  this.id = sha1(idValue);
  this.title = title;
  this.shortDescription = shortDescription;
  this.text = text;
  this.author = author;
  this.thruDate = thruDate;
}

Announcement.prototype.fromObject = function (object) {
  this.id = object.id;
  this.title = object.title;
  this.shortDescription = object.shortDescription;
  this.text = object.text;
  this.author = object.author;
  this.fromDate = object.fromDate;
  this.thruDate = object.thruDate;

  return this;
};

Announcement.prototype.isValid = function () {
  return !!this.id;
};

Announcement.prototype.isActive = function (currentDate) {
  var now = currentDate || Date.now();
  return this.fromDate <= now && (typeof this.thruDate === 'undefined' || this.thruDate > now);
};

module.exports = Announcement;
