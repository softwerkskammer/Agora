"use strict";

var moment = require('moment');
var Encoder = require('node-html-encoder').Encoder;
var encoder = new Encoder('entity');

function Mail(object) {
  this.id = object.id;
  this.group = object.group;
  this.subject = object.subject;
  this.from = object.from;
  this.timeUnix = object.timeUnix;
  this.references = object.references;
  this.text = object.text;
  if (object.html) { this.html = object.html; }
  else if (object.text) {
    this.html = "<div>\n" + encoder.htmlEncode(object.text).replace(/&#10;/g, "<br>\n") + "\n</div>";
  }

  this.time = moment.unix(this.timeUnix);
  this.time.lang("de");
  this.displayedTime = this.time.format("LLLL");
  if (object.from) {
    if (object.from.name) {
      this.displayedSenderName = object.from.name;
    }
    else if (object.from.address) {
      this.displayedSenderName = object.from.address.replace(/@.*/, "");
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

  if (object.references && object.references[0]) {
    this.threadId = object.references[0];
  }
  else {
    this.threadId = this.id;
  }

}

module.exports = Mail;
