"use strict";

var _ = require('underscore');

var formatEMailAddress = function (member) {
  return  '"' + member.displayName() + '" <' + member.email + '>';
};

function Message(body, member) {
  if (body && member) {
    this.setSubject(body.subject);
    this.setMarkdown(body.markdown);
    this.setHtmlAddOn(body.htmlAddOn);
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

Message.prototype.setReceiver = function (member) {
  this.receiver = member;
  this.bcc = member.email;
};

Message.prototype.setSubject = function (subject) {
  this.subject = subject;
};

Message.prototype.setMarkdown = function (markdown) {
  this.markdown = markdown;
};

Message.prototype.setHtmlAddOn = function (html) {
  this.htmlAddOn = html;
};

module.exports = Message;
