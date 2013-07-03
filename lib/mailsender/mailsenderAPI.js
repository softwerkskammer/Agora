"use strict";

var nodemailer = require('nodemailer');
var markdown = require('markdown').markdown;

var conf = require('nconf');

var transport = nodemailer.createTransport(conf.get('transport'), conf.get('transport-options'));

module.exports = {
  sendMail: function (message, callback) {
    var transportObject = {
      from: 'info@softwerkskammer.org',
      replyTo: message.from,
      to: message.to,
      cc: message.cc,
      bcc: message.bcc,
      subject: message.subject,
      html: markdown.toHTML(message.markdown.replace(/\r/g, '')) + '\n\n' + message.htmlAddOn,
      generateTextFromHTML: true
    };
    transport.sendMail(transportObject, callback);
  }
};
