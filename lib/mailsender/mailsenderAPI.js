"use strict";

var conf = require('nconf');
var nodemailer = require('nodemailer');

var transport = nodemailer.createTransport(conf.get('transport'), conf.get('transport-options'));

module.exports = {
  sendMail: function (message, callback) {
    transport.sendMail(message, callback);
  }
};
