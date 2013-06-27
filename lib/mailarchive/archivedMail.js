"use strict";

var moment = require('moment');
var Encoder = require('node-html-encoder').Encoder;
var encoder = new Encoder('entity');

function ArchivedMail(object) {
  this.id = object.id;
  this.group = object.group;
  this.subject = object.subject;
  this.from = object.from;
  if (object.timeUnix) {
    this.timeUnix = object.timeUnix;
  }
  else {
    this.timeUnix = 0;
  }
  this.references = object.references;
  this.text = object.text;
  if (object.html) { this.html = object.html; }
  else if (object.text) {
    this.html = "<div>\n" + encoder.htmlEncode(object.text).replace(/&#10;/g, "<br>\n") + "\n</div>";
  }

  if (this.timeUnix) {
    this.time = moment.unix(this.timeUnix);
    this.time.lang("de");
    this.displayedTime = this.time.format("LLLL");
  }
  if (object.from) {
    if (object.from.name) {
      this.displayedSenderName = object.from.name;
    }
    if (object.from.id) {
      this.memberId = object.from.id;
    }
    else {
      this.memberId = null;
    }
  }
  if (!this.displayedSenderName) {
    this.displayedSenderName = "";
  }
}

module.exports = ArchivedMail;
