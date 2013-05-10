"use strict";
var conf = require('nconf');
var fieldHelpers = conf.get('beans').get('fieldHelpers');
var moment = require('moment');

function Message() {
}

Member.prototype.setFrom = function (fromAddress) {
  this.from = fromAddress;
};

Member.prototype.setTo = function (toAddresses) {
  this.to = toAddresses;
};

Member.prototype.setBcc = function (bccAddresses) {
  this.bcc = bccAddresses;
};

Member.prototype.setSubject = function (subject) {
  this.subject = subject;
};

Member.prototype.setHtmlText = function (htmlText) {
  this.html = htmlText;
  this.generateTextFromHTML = true;
};

var formatEMailAddress = function (member) {
  return  '"' + member.displayName() +'" <' + member.email + '>';
}

Member.prototype.fromMember = function (member) {
  if (member) {
    this.setFrom(formatEMailAddress(member));
  }
  return this;
};

module.exports = Member;
