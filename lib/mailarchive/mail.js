"use strict";

var moment = require('moment');

function Mail(object) {
  this.id = object.id;
  this.group = object.group;
  this.subject = object.subject;
  this.from = object.from;
  this.dateUnix = object.dateUnix;
  this.references = object.references;
  this.text = object.text;
  this.html = object.html;
  this.time = moment.unix(this.dateUnix);
  if (object.references && object.references[0]) {
    this.threadId = object.references[0];
  }
  else {
    this.threadId = this.id;
  }

}

module.exports = Mail;
