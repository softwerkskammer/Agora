'use strict';

var _ = require('lodash');
var jade = require('jade');
var path = require('path');
var conf = require('simple-configure');
var beans = conf.get('beans');
var publicUrlPrefix = conf.get('publicUrlPrefix');
var misc = beans.get('misc');
var Renderer = beans.get('renderer');

function Message(body, member) {
  this.buttons = [];
  if (body && member) {
    this.setSubject(body.subject);
    this.setMarkdown(body.markdown);
    this.senderName = member.displayName();
    this.senderAddress = member.email();
    this.buttons = body.buttons ? JSON.parse(body.buttons) : [];
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
  this.setBccToMemberAddresses(_(groups).compact().map('members').flatten().value());
};

Message.prototype.setBccToMemberAddresses = function (members) {
  this.bcc = _(members).compact().map(function (member) { return member.email(); }).uniq().value();
};

Message.prototype.setReceiver = function (member) {
  this.receiver = member; // required for UI (see jade-file)
  this.bcc = member.email();
};

Message.prototype.setSubject = function (subject) {
  this.subject = subject;
};

Message.prototype.setMarkdown = function (markdown) {
  this.markdown = markdown || '';
};

Message.prototype.addToButtons = function (buttonOrButtons) {
  this.buttons = this.buttons.concat(misc.toArray(buttonOrButtons));
};

Message.prototype.removeAllButFirstButton = function () {
  if (!this.buttons || this.buttons.length === 0) { return; }
  this.buttons = [this.buttons[0]];
};

Message.prototype.toTransportObject = function (senderAddress) {
  var formatEMailAddress = function (name, email) {
    return '"' + name + '" <' + email + '>';
  };

  var modifiedMarkdown = this.markdown.replace(/\]\(\//g, '](' + publicUrlPrefix + '/');

  var renderingOptions = {
    pretty: true,
    content: Renderer.render(modifiedMarkdown),
    plain: modifiedMarkdown,
    buttons: this.buttons
  };
  var filename = path.join(__dirname, 'views/mailtemplate.jade');
  var filenameTextonly = path.join(__dirname, 'views/mailtemplate-textonly.jade');

  var fromName = (this.senderName ? this.senderName + ' via ' : '') + (conf.get('domainname') || 'softwerkskammer.org');
  var replyTo = this.senderName ? formatEMailAddress(this.senderName, this.senderAddress) : undefined;
  return {
    from: formatEMailAddress(fromName, senderAddress),
    replyTo: replyTo,
    to: this.to,
    cc: this.cc,
    bcc: this.bcc,
    subject: this.subject,
    text: jade.renderFile(filenameTextonly, renderingOptions),
    html: jade.renderFile(filename, renderingOptions)
  };
};

module.exports = Message;
