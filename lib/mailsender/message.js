"use strict";

var _ = require('underscore');
var markdown = require('markdown').markdown;

var formatEMailAddress = function (member) {
  return  '"' + member.displayName() + '" <' + member.email + '>';
};

function Message(body, member) {
  if (body && member) {
    this.setSubject(body.subject);
    this.setHtmlText(body.htmlText);
    var mailaddress = formatEMailAddress(member);
    this.setFrom(mailaddress);
    if (body.sendCopyToSelf) {
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

Message.prototype.setBccToGroupMemberAddresses = function (groups) {
  var message = this;
  message.bcc = [];
  _.map(groups, function (group) { _.map(group.members, function (member) { message.bcc.push(member.email); }); });
  message.bcc = _.uniq(message.bcc);
};

Message.prototype.setSubject = function (subject) {
  this.subject = subject;
};

Message.prototype.setHtmlText = function (htmlText) {
  this.html = markdown.toHTML(htmlText.replace(/\r/g, ''));
  this.generateTextFromHTML = true;
};

module.exports = Message;
