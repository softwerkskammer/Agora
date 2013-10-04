"use strict";

var moment = require('moment-timezone');
var Encoder = require('node-html-encoder').Encoder;
var encoder = new Encoder('entity');
var conf = require('nconf');
var fieldHelpers = conf.get('beans').get('fieldHelpers');

function ArchivedMail(object) {
  if (!object.id) {
    throw new Error("message has no valid id");
  }
  this.id = object.id;
  this.group = object.group;
  this.subject = object.subject;
  this.from = object.from;
  this.timeUnix = object.timeUnix || 0;
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
    this.memberId = object.from.id || null;
  }
}

ArchivedMail.prototype.getHtml = function () {
  return fieldHelpers.replaceLongNumbers(fieldHelpers.replaceMailAddresses(this.html));
};

ArchivedMail.prototype.memberNickname = function () {
  return this.member ? this.member.nickname : null;
};

ArchivedMail.prototype.displayedSenderName = function () {
  return this.member ? this.member.displayName() : (this.from.name || '');
};

module.exports = ArchivedMail;
