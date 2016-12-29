'use strict';

module.exports = {
  sendMail: function (transportobject, callback) {
    if (!transportobject.to && (!transportobject.bcc || transportobject.bcc.length === 0)) {
      // simulating the behaviour of nodemailer
      return callback(new Error());
    }
    callback(null);
  }
};
