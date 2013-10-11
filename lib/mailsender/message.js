"use strict";

var _ = require('underscore');
var Renderer = require('nconf').get('beans').get('renderer');

function Message(body, member) {
  if (body && member) {
    this.setSubject(body.subject);
    this.setMarkdown(body.markdown);
    this.setHtmlAddOn(body.htmlAddOn);
    this.senderName = member.displayName();
    this.senderAddress = member.email;
    if (body.sendCopyToSelf) {
      this.setTo(member.email);
    }
  }
  return this;
}

Message.prototype.setTo = function (toAddresses) {
  this.to = toAddresses;
};

Message.prototype.setBccToGroupMemberAddresses = function (groups) {
  var message = this;
  message.bcc = [];
  _.map(groups, function (group) { _.map(group.members, function (member) { message.bcc.push(member.email); }); });
  message.bcc = _.uniq(message.bcc);
};

Message.prototype.setBccToMemberAddresses = function (members) {
  var message = this;
  message.bcc = [];
  _.map(members, function (member) { message.bcc.push(member.email); });
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
  this.markdown = markdown ? markdown : '';
};

Message.prototype.setHtmlAddOn = function (html) {
  this.htmlAddOn = html;
};

Message.prototype.toTransportObject = function (senderAddress) {
  var formatEMailAddress = function (name, email) {
    return  '"' + name + '" <' + email + '>';
  };

  return {
    from: formatEMailAddress(this.senderName + ' via softwerkskammer.org', senderAddress),
    replyTo: formatEMailAddress(this.senderName, this.senderAddress),
    to: this.to,
    cc: this.cc,
    bcc: this.bcc,
    subject: this.subject,
    html: Renderer.render(this.markdown) + '\n\n' + this.htmlAddOn,
    generateTextFromHTML: true
  };
};

module.exports = Message;
