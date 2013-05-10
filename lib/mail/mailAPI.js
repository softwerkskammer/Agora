var nodemailer = require('nodemailer');

var transport = nodemailer.createTransport("sendmail", {});

module.exports = {
  sendMail: function (message, callback) {
    transport.sendMail(message, callback);
  }
};
