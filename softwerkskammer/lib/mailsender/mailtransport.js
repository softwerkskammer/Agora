'use strict';

var conf = require('simple-configure');

var beans = conf.get('beans');
var statusmessage = beans.get('statusmessage');
var logger = require('winston').loggers.get('application');

// we need to expose the core in order to stub that during automated tests
var transport = require('nodemailer').createTransport(require('simple-configure').get('transport-options'));

function statusmessageForError(type, err) {
  return statusmessage.errorMessage('message.title.email_problem', 'message.content.mailsender.error_reason', {
    type: type,
    err: err.toString()
  });
}

function statusmessageForSuccess(type) {
  return statusmessage.successMessage('message.title.email_successful', 'message.content.mailsender.success', {type: type});
}

function sendMail(message, type, senderAddress, callback) {
  transport.sendMail(message.toTransportObject(senderAddress), function (err) {
    if (err) { logger.error(err.stack); }
    callback(null, err ? statusmessageForError(type, err) : statusmessageForSuccess(type));
  });
}

module.exports = {
  transport: transport,
  sendMail: sendMail,
  statusmessageForError: statusmessageForError,
  statusmessageForSuccess: statusmessageForSuccess
};
