'use strict';

var _ = require('lodash');
var moment = require('moment-timezone');
var Encoder = require('node-html-encoder').Encoder;
var encoder = new Encoder('entity');
var fieldHelpers = require('nconf').get('beans').get('fieldHelpers');

function ArchivedMail(object) {
  this.id = object.id;
  this.group = object.group;
  this.subject = object.subject;
  this.from = object.from;
  this.timeUnix = object.timeUnix || 0;
  this.references = object.references;
  this.text = object.text;
  if (object.html) {
    this.html = object.html;
  } else if (this.text) {
    this.html = '<div>\n' + encoder.htmlEncode(object.text).replace(/&#10;/g, '<br>\n') + '\n</div>';
  }

  this.time = this.timeUnix && moment.unix(this.timeUnix);
  this.responses = [];
}

ArchivedMail.prototype.getHtml = function () {
  return fieldHelpers.killHtmlHead(fieldHelpers.replaceLongNumbers(fieldHelpers.replaceMailAddresses(this.html)));
};

ArchivedMail.prototype.memberNickname = function () {
  return this.member ? this.member.nickname() : null;
};

ArchivedMail.prototype.displayedSenderName = function () {
  return this.member ? this.member.displayName() : (this.from ? this.from.name || '' : '');
};

ArchivedMail.prototype.memberId = function () {
  return this.from ? this.from.id : null;
};

ArchivedMail.prototype.sortedResponses = function () {
  return this.responses.sort(function (a, b) { return a.timeUnix - b.timeUnix; });
};

ArchivedMail.prototype.youngestResponse = function () {
  if (this.responses && this.responses.length > 0) {
    return _.reduce(this.responses, function (memo, response) {
      return response.youngestResponse().timeUnix > memo.youngestResponse().timeUnix ? response : memo;
    }, this.responses[0]);
  }
  return this;
};

module.exports = ArchivedMail;
