"use strict";

var markdown = require('markdown').markdown;

function Announcement(object) {
  if (object) {
    var now = object.fromDate || Date.now();

    this.fromDate = now;
    this.id = object.id;
    this.url = object.url.trim();
    this.title = object.title;
    this.text = object.text;
    this.author = object.author;
    this.thruDate = object.thruDate;
  }
  return this;
}

Announcement.prototype.isValid = function () {
  return !!this.id;
};

Announcement.prototype.textHTML = function () {
  return markdown.toHTML(this.text.replace(/\r/g, ''));
};

module.exports = Announcement;
