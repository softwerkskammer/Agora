"use strict";
var conf = require('nconf');
var moment = require('moment');
var markdown = require('markdown').markdown;

var fieldHelpers = conf.get('beans').get('fieldHelpers');

function Message(body, member) {
  if (body && member) {
    this.setSubject(body.subject);
    this.setHtmlText(body.htmlText);
    var mailaddress = formatEMailAddress(member);
    this.setFrom(mailaddress);
    if (body.sendCopyToSelf){
      this.setTo(mailaddress);
    }
  }
  return this;
}

Message.prototype.setFrom = function (fromAddress) {
  this.from = fromAddress;
};

Message.prototype.setTo = function (toAddresses) {
  this.to = toAddresses;
};

Message.prototype.setBcc = function (bccAddresses) {
  this.bcc = bccAddresses;
};

Message.prototype.setSubject = function (subject) {
  this.subject = subject;
};

Message.prototype.setHtmlText = function (htmlText) {
  this.html = markdown.toHTML(htmlText.replace(/\r/g, ''));
  this.generateTextFromHTML = true;
};

var formatEMailAddress = function (member) {
  return  '"' + member.displayName() +'" <' + member.email + '>';
}

module.exports = Message;
