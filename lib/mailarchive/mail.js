"use strict";

var moment = require('moment');

function Mail(object) {
  this.id = object.id;
  this.group = object.group;
  this.subject = object.subject;
  this.from = object.from;
  this.timeUnix = object.timeUnix;
  this.references = object.references;
  this.text = object.text;
  this.html = object.html;
  this.time = moment.unix(this.timeUnix);
  this.displayedTime = this.time.format();
  if (object.from) {
    if (object.from.name) {
      this.displayedSenderName = object.name;
    }
    else if (object.from.address) {
      this.displayedSenderName = object.address;
    }
  }
  if (!this.displayedSenderName) {
    this.displayedSenderName = "";
  }

  if (object.references && object.references[0]) {
    this.threadId = object.references[0];
  }
  else {
    this.threadId = this.id;
  }

}

module.exports = Mail;
