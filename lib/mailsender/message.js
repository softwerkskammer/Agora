"use strict";

var _ = require('lodash');
var jade = require('jade');
var path = require('path');
var Renderer = require('nconf').get('beans').get('renderer');

function Message(body, member) {
  if (body && member) {
    this.setSubject(body.subject);
    this.setMarkdown(body.markdown);
    this.setHtmlAddOn(body.htmlAddOn);
    this.senderName = member.displayName();
    this.senderAddress = member.email();
    if (body.sendCopyToSelf) {
      this.setTo(member.email());
    }
  }
  return this;
}

Message.prototype.setTo = function (toAddresses) {
  this.to = toAddresses;
};

Message.prototype.setBccToGroupMemberAddresses = function (groups) {
  this.setBccToMemberAddresses(_.chain(groups).pluck('members').flatten().value());
};

Message.prototype.setBccToMemberAddresses = function (members) {
  this.bcc = _.chain(members).map(function (member) { return member.email(); }).uniq().value();
};

Message.prototype.setReceiver = function (member) {
  this.receiver = member; // required for UI (see jade-file)
  this.bcc = member.email();
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

  var renderingOptions = {
    pretty: true,
    content: Renderer.render(this.markdown),
    extraStuff: this.htmlAddOn || ""
  };
  var filename = path.join(__dirname, 'views/mailtemplate.jade');

  var fromName = (this.senderName ? this.senderName + ' via ' : '') + 'softwerkskammer.org';
  var replyTo = this.senderName ? formatEMailAddress(this.senderName, this.senderAddress) : undefined;
  return {
    from: formatEMailAddress(fromName, senderAddress),
    replyTo: replyTo,
    to: this.to,
    cc: this.cc,
    bcc: this.bcc,
    subject: this.subject,
    html: jade.renderFile(filename, renderingOptions),
    generateTextFromHTML: true
  };
};

module.exports = Message;
