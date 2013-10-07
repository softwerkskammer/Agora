"use strict";

var nodemailer = require('nodemailer');
var conf = require('nconf');
var Renderer = conf.get('beans').get('renderer');

var transport = nodemailer.createTransport(conf.get('transport'), conf.get('transport-options'));

var formatEMailAddress = function (name, email) {
  return  '"' + name + '" <' + email + '>';
};

module.exports = {
  sendMail: function (message, callback) {
    var transportObject = {
      from: formatEMailAddress(message.senderName + ' via softwerkskammer.org', conf.get('sender-address')),
      replyTo: formatEMailAddress(message.senderName, message.senderAddress),
      to: message.to,
      cc: message.cc,
      bcc: message.bcc,
      subject: message.subject,
      html: Renderer.render(message.markdown) + '\n\n' + message.htmlAddOn,
      generateTextFromHTML: true
    };
    transport.sendMail(transportObject, callback);
  }
};
