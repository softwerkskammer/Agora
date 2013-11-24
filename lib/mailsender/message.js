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
  this.setBccToMemberAddresses(_.chain(groups).pluck('members').flatten().value());
};

Message.prototype.setBccToMemberAddresses = function (members) {
  this.bcc = _.chain(members).pluck('email').uniq().value();
};

Message.prototype.setReceiver = function (member) {
  this.receiver = member; // required for UI (see jade-file)
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
  var styledefinition = '<head><style type="text/css">' +
    'a.btn {' +
    'background-color: rgb(66, 139, 202);' +
    'border-bottom-color: rgb(53, 126, 189);' +
    'border-bottom-left-radius: 4px;' +
    'border-bottom-right-radius: 4px;' +
    'border-bottom-style: solid;' +
    'border-bottom-width: 1px;' +
    'border-image-outset: 0px;' +
    'border-image-repeat: stretch;' +
    'border-image-slice: 100%;' +
    'border-image-source: none;' +
    'border-image-width: 1;' +
    'border-left-color: rgb(53, 126, 189);' +
    'border-left-style: solid;' +
    'border-left-width: 1px;' +
    'border-right-color: rgb(53, 126, 189);' +
    'border-right-style: solid;' +
    'border-right-width: 1px;' +
    'border-top-color: rgb(53, 126, 189);' +
    'border-top-left-radius: 4px;' +
    'border-top-right-radius: 4px;' +
    'border-top-style: solid;' +
    'border-top-width: 1px;' +
    'box-sizing: border-box;' +
    'color: rgb(255, 255, 255);' +
    'cursor: pointer;' +
    'display: block;' +
    'font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;' +
    'font-size: 14px;' +
    'font-weight: normal;' +
    'height: 34px;' +
    'line-height: 20px;' +
    'margin-bottom: 6px;' +
    'padding-bottom: 6px;' +
    'padding-left: 12px;' +
    'padding-right: 12px;' +
    'padding-top: 6px;' +
    'text-align: center;' +
    'text-decoration: none;' +
    'vertical-align: middle;' +
    'white-space: nowrap;}' +
    '</style></head>';

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
    html: '<html>' + styledefinition + '<body>' + Renderer.render(this.markdown) + '\n\n' + (this.htmlAddOn || "") + '</body></html>',
    generateTextFromHTML: true
  };
};

module.exports = Message;
